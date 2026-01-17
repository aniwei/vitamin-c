// Cheap WebGL bindings for CanvasKit (custom implementation).

#include <string>
#include <unordered_map>
#include <chrono>

#include <GLES2/gl2.h>
#include <emscripten/html5.h>

#include "include/core/SkCanvas.h"
#include "include/core/SkColorFilter.h"
#include "include/core/SkColorSpace.h"
#include "include/core/SkData.h"
#include "include/core/SkFontMgr.h"
#include "include/core/SkImage.h"
#include "include/core/SkImageInfo.h"
#include "include/core/SkMatrix.h"
#include "include/core/SkMaskFilter.h"
#include "include/core/SkPaint.h"
#include "include/core/SkPath.h"
#include "include/core/SkPathBuilder.h"
#include "include/core/SkPathEffect.h"
#include "include/core/SkRRect.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkSamplingOptions.h"
#include "include/core/SkShader.h"
#include "include/core/SkSpan.h"
#include "include/core/SkString.h"
#include "include/core/SkSurface.h"
#include "include/core/SkTextBlob.h"
#include "include/core/SkVertices.h"
#include "include/effects/SkCornerPathEffect.h"
#include "include/effects/SkDashPathEffect.h"
#include "include/effects/SkDiscretePathEffect.h"
#include "include/effects/SkGradientShader.h"
#include "include/effects/SkImageFilters.h"
#include "include/encode/SkPngEncoder.h"
#include "modules/skparagraph/include/FontCollection.h"
#include "modules/skparagraph/include/Paragraph.h"
#include "modules/skparagraph/include/ParagraphBuilder.h"
#include "modules/skparagraph/include/ParagraphStyle.h"
#include "modules/skparagraph/include/TextStyle.h"
#include "modules/skunicode/include/SkUnicode_icu.h"
#include "include/gpu/ganesh/GrBackendSurface.h"
#include "include/gpu/ganesh/GrDirectContext.h"
#include "include/gpu/ganesh/GrTypes.h"
#include "include/gpu/ganesh/SkImageGanesh.h"
#include "include/gpu/ganesh/SkSurfaceGanesh.h"
#include "include/gpu/ganesh/gl/GrGLBackendSurface.h"
#include "include/gpu/ganesh/gl/GrGLDirectContext.h"
#include "include/gpu/ganesh/gl/GrGLInterface.h"
#include "include/gpu/ganesh/gl/GrGLTypes.h"
#include "src/gpu/ganesh/gl/GrGLDefines.h"

namespace {

struct ColorSettings {
	ColorSettings(sk_sp<SkColorSpace> colorSpace) {
		if (colorSpace == nullptr || colorSpace->isSRGB()) {
			colorType = kRGBA_8888_SkColorType;
			pixFormat = GR_GL_RGBA8;
		} else {
			colorType = kRGBA_F16_SkColorType;
			pixFormat = GR_GL_RGBA16F;
		}
	}

	SkColorType colorType;
	GrGLenum pixFormat;
};

struct WebGLContextState {
	sk_sp<GrDirectContext> context;
};

static std::unordered_map<uint32_t, WebGLContextState> gWebGLContexts;
static EMSCRIPTEN_WEBGL_CONTEXT_HANDLE gLastMadeCurrentWebGLContext = 0;
// 0 = ok/unknown, 1 = no current WebGL ctx, 2 = MakeWebGLInterface failed, 3 = MakeGL context failed
static int gWebGLLastError = 0;

static EMSCRIPTEN_WEBGL_CONTEXT_HANDLE CurrentWebGLContext() {
	return emscripten_webgl_get_current_context();
}

static WebGLContextState* GetOrCreateWebGLState(EMSCRIPTEN_WEBGL_CONTEXT_HANDLE handle) {
	if (!handle) {
		gWebGLLastError = 1;
		return nullptr;
	}

	const uint32_t key = static_cast<uint32_t>(handle);
	auto it = gWebGLContexts.find(key);
	if (it != gWebGLContexts.end()) {
		gWebGLLastError = 0;
		return &it->second;
	}

	auto interface = GrGLMakeNativeInterface();
	if (!interface) {
		gWebGLLastError = 2;
		return nullptr;
	}

	auto context = GrDirectContexts::MakeGL(interface);
	if (!context) {
		gWebGLLastError = 3;
		return nullptr;
	}

	WebGLContextState state;
	state.context = std::move(context);
	auto inserted = gWebGLContexts.emplace(key, std::move(state));
	gWebGLLastError = 0;
	return &inserted.first->second;
}

static WebGLContextState* CurrentWebGLState() {
	const auto handle = CurrentWebGLContext();
	if (!handle) {
		gWebGLLastError = 1;
		return nullptr;
	}
	return GetOrCreateWebGLState(handle);
}

static bool EnsureGLContext() {
	return CurrentWebGLState() != nullptr;
}

static sk_sp<SkSurface> MakeOnScreenGLSurface(sk_sp<GrDirectContext> dContext,
																							int width,
																							int height,
																							sk_sp<SkColorSpace> colorSpace,
																							int sampleCnt,
																							int stencil) {
	// Ensure Skia sees a clean framebuffer state.
	glBindFramebuffer(GL_FRAMEBUFFER, 0);
	glClearColor(0, 0, 0, 0);
	glClearStencil(0);
	glClear(GL_COLOR_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);
	dContext->resetContext(kRenderTarget_GrGLBackendState | kMisc_GrGLBackendState);

	GrGLFramebufferInfo info;
	info.fFBOID = 0;

	if (!colorSpace) {
		colorSpace = SkColorSpace::MakeSRGB();
	}

	const auto colorSettings = ColorSettings(colorSpace);
	info.fFormat = colorSettings.pixFormat;
	auto target = GrBackendRenderTargets::MakeGL(width, height, sampleCnt, stencil, info);

	return SkSurfaces::WrapBackendRenderTarget(
		dContext.get(),
		target,
		kBottomLeft_GrSurfaceOrigin,
		colorSettings.colorType,
		colorSpace,
		nullptr
	);
}

static sk_sp<SkSurface> MakeOnScreenGLSurface(sk_sp<GrDirectContext> dContext,
																							int width,
																							int height,
																							sk_sp<SkColorSpace> colorSpace) {
	GrGLint sampleCnt = 0;
	glGetIntegerv(GL_SAMPLES, &sampleCnt);

	GrGLint stencil = 0;
	glGetIntegerv(GL_STENCIL_BITS, &stencil);

	return MakeOnScreenGLSurface(dContext, width, height, colorSpace, sampleCnt, stencil);
}

static sk_sp<SkSurface> MakeRenderTarget(sk_sp<GrDirectContext> dContext, int width, int height) {
	SkImageInfo info = SkImageInfo::MakeN32(width, height, SkAlphaType::kPremul_SkAlphaType, SkColorSpace::MakeSRGB());

	return SkSurfaces::RenderTarget(
		dContext.get(),
		skgpu::Budgeted::kYes,
		info,
		0,
		kBottomLeft_GrSurfaceOrigin,
		nullptr,
		true
	);
}

static SkMatrix ReadMatrix9(const float* m9) {
	if (!m9) return SkMatrix::I();
	return SkMatrix::MakeAll(
		m9[0], m9[1], m9[2],
		m9[3], m9[4], m9[5],
		m9[6], m9[7], m9[8]
	);
}

static void WriteMatrix9(float* outPtr, const SkMatrix& matrix) {
	if (!outPtr) return;
	SkScalar m[9];
	matrix.get9(m);
	for (int i = 0; i < 9; i++) {
		outPtr[i] = m[i];
	}
}

static void WriteRectLTRB(float* outPtr, const SkRect& rect) {
	if (!outPtr) return;
	outPtr[0] = rect.left();
	outPtr[1] = rect.top();
	outPtr[2] = rect.right();
	outPtr[3] = rect.bottom();
}

static SkSamplingOptions SamplingFrom(int filterMode, int mipmapMode) {
	SkFilterMode filter = SkFilterMode::kNearest;
	if (filterMode == 1) {
		filter = SkFilterMode::kLinear;
	}

	SkMipmapMode mipmap = SkMipmapMode::kNone;
	if (mipmapMode == 1) {
		mipmap = SkMipmapMode::kNearest;
	} else if (mipmapMode == 2) {
		mipmap = SkMipmapMode::kLinear;
	}

	return SkSamplingOptions(filter, mipmap);
}

static SkTileMode ToTileMode(int mode) {
	if (mode == 1) return SkTileMode::kRepeat;
	if (mode == 2) return SkTileMode::kMirror;
	if (mode == 3) return SkTileMode::kDecal;
	return SkTileMode::kClamp;
}

static SkBlendMode ToBlendMode(int mode) {
	return static_cast<SkBlendMode>(mode);
}

static SkPaint::Style ToPaintStyle(int style) {
	return static_cast<SkPaint::Style>(style);
}

static SkPaint::Cap ToStrokeCap(int cap) {
	return static_cast<SkPaint::Cap>(cap);
}

static SkPaint::Join ToStrokeJoin(int join) {
	return static_cast<SkPaint::Join>(join);
}

static SkPathFillType ToPathFillType(int fillType) {
	return static_cast<SkPathFillType>(fillType);
}

static SkPathDirection ToPathDirection(int dir) {
	return static_cast<SkPathDirection>(dir);
}

static SkBlurStyle ToBlurStyle(int style) {
	return static_cast<SkBlurStyle>(style);
}

static SkCanvas::PointMode ToPointMode(int mode) {
	return static_cast<SkCanvas::PointMode>(mode);
}

static SkVertices::VertexMode ToVertexMode(int mode) {
	return static_cast<SkVertices::VertexMode>(mode);
}

struct CheapPath {
	SkPathBuilder builder;
};

static sk_sp<SkTypeface> MakeTypefaceFromData(const void* bytes, int byteLength) {
	if (!bytes || byteLength <= 0) return nullptr;
	auto data = SkData::MakeWithCopy(bytes, static_cast<size_t>(byteLength));
	if (!data) return nullptr;
	auto mgr = SkFontMgr::RefEmpty();
	if (!mgr) return nullptr;
	return mgr->makeFromData(std::move(data));
}

static std::unique_ptr<skia::textlayout::ParagraphBuilder> MakeParagraphBuilderInternal(
	const void* fontBytes,
	int fontByteLength,
	float fontSize,
	uint32_t color,
	int textAlign,
	int maxLines,
	const char* ellipsisUtf8,
	int ellipsisByteLength
) {
	skia::textlayout::ParagraphStyle paragraphStyle;
	paragraphStyle.setTextAlign(static_cast<skia::textlayout::TextAlign>(textAlign));
	if (maxLines > 0) {
		paragraphStyle.setMaxLines(static_cast<size_t>(maxLines));
	}
	if (ellipsisUtf8 && ellipsisByteLength > 0) {
		paragraphStyle.setEllipsis(SkString(ellipsisUtf8, static_cast<size_t>(ellipsisByteLength)));
	}

	skia::textlayout::TextStyle textStyle;
	textStyle.setFontSize(fontSize);
	textStyle.setColor(static_cast<SkColor>(color));
	if (auto typeface = MakeTypefaceFromData(fontBytes, fontByteLength)) {
		textStyle.setTypeface(std::move(typeface));
	}
	paragraphStyle.setTextStyle(textStyle);

	auto fontCollection = sk_make_sp<skia::textlayout::FontCollection>();
	fontCollection->setDefaultFontManager(SkFontMgr::RefEmpty());

	auto unicode = SkUnicodes::ICU::Make();
	return skia::textlayout::ParagraphBuilder::make(paragraphStyle, std::move(fontCollection), std::move(unicode));
}

}  // namespace

extern "C" {

// WebGL helpers for cheap runtime.
// selectorUtf8 is NOT guaranteed to be null-terminated; byteLength is provided.
int WebGL_CreateContext(const char* selectorUtf8, int byteLength, int webgl2) {
	if (!selectorUtf8 || byteLength <= 0) {
		return 0;
	}

	std::string selector(selectorUtf8, static_cast<size_t>(byteLength));

	EmscriptenWebGLContextAttributes attrs;
	emscripten_webgl_init_context_attributes(&attrs);
	attrs.alpha = EM_TRUE;
	attrs.depth = EM_TRUE;
	attrs.stencil = EM_TRUE;
	attrs.antialias = EM_TRUE;
	attrs.premultipliedAlpha = EM_TRUE;
	attrs.preserveDrawingBuffer = EM_FALSE;
	attrs.enableExtensionsByDefault = EM_TRUE;
	attrs.majorVersion = webgl2 ? 2 : 1;
	attrs.minorVersion = 0;

	EMSCRIPTEN_WEBGL_CONTEXT_HANDLE ctx = emscripten_webgl_create_context(selector.c_str(), &attrs);
	return static_cast<int>(ctx);
}

int WebGL_MakeContextCurrent(int ctx) {
	if (!ctx) {
		return -1;
	}
	const auto result = emscripten_webgl_make_context_current(static_cast<EMSCRIPTEN_WEBGL_CONTEXT_HANDLE>(ctx));
	if (result != EMSCRIPTEN_RESULT_SUCCESS) {
		return -static_cast<int>(result);
	}

	gLastMadeCurrentWebGLContext = static_cast<EMSCRIPTEN_WEBGL_CONTEXT_HANDLE>(ctx);
	GetOrCreateWebGLState(gLastMadeCurrentWebGLContext);
	return 0;
}

int WebGL_DestroyContext(int ctx) {
	if (!ctx) {
		return -1;
	}

	const uint32_t key = static_cast<uint32_t>(ctx);
	gWebGLContexts.erase(key);
	const auto result = emscripten_webgl_destroy_context(static_cast<EMSCRIPTEN_WEBGL_CONTEXT_HANDLE>(ctx));
	return result == EMSCRIPTEN_RESULT_SUCCESS ? 0 : -static_cast<int>(result);
}

void* MakeGrContextWebGL() {
	WebGLContextState* state = CurrentWebGLState();
	if (!state) {
		return nullptr;
	}
	return state->context.get();
}

int WebGL_GetSampleCount() {
	GrGLint sampleCnt = 0;
	glGetIntegerv(GL_SAMPLES, &sampleCnt);
	return sampleCnt;
}

int WebGL_GetStencilBits() {
	GrGLint stencil = 0;
	glGetIntegerv(GL_STENCIL_BITS, &stencil);
	return stencil;
}

int WebGL_GetLastError() {
	return gWebGLLastError;
}

void* MakeOnScreenCanvasSurface(int width, int height) {
	WebGLContextState* state = CurrentWebGLState();
	if (!state) {
		return nullptr;
	}
	auto surface = MakeOnScreenGLSurface(state->context, width, height, nullptr);
	return surface.release();
}

void* MakeOnScreenCanvasSurfaceEx(int width, int height, int sampleCount, int stencilBits) {
	WebGLContextState* state = CurrentWebGLState();
	if (!state) {
		return nullptr;
	}
	auto surface = MakeOnScreenGLSurface(state->context, width, height, nullptr, sampleCount, stencilBits);
	return surface.release();
}

void* MakeRenderTargetSurface(int width, int height) {
	WebGLContextState* state = CurrentWebGLState();
	if (!state) {
		return nullptr;
	}
	auto surface = MakeRenderTarget(state->context, width, height);
	return surface.release();
}

void* MakeRenderTarget(int width, int height) {
	return MakeRenderTargetSurface(width, height);
}

void DeleteSurface(void* surface) {
	delete static_cast<SkSurface*>(surface);
}

void* Surface_getCanvas(void* surface) {
	if (!surface) return nullptr;
	return static_cast<SkSurface*>(surface)->getCanvas();
}

void Surface_flush(void* surface) {
	if (!surface) return;
	WebGLContextState* state = CurrentWebGLState();
	if (!state) return;
	state->context->flushAndSubmit(static_cast<SkSurface*>(surface), GrSyncCpu::kNo);
}

int Surface_width(void* surface) {
	if (!surface) return 0;
	return static_cast<SkSurface*>(surface)->width();
}

int Surface_height(void* surface) {
	if (!surface) return 0;
	return static_cast<SkSurface*>(surface)->height();
}

// GrDirectContext helpers (WebGL-only).
void* GetCurrentGrContext() {
	WebGLContextState* state = CurrentWebGLState();
	if (!state) {
		return nullptr;
	}
	return state->context.get();
}

void GrContext_flush(void* context) {
	if (!context) return;
	static_cast<GrDirectContext*>(context)->flush();
}

void GrContext_submit(void* context, int syncCpu) {
	if (!context) return;
	static_cast<GrDirectContext*>(context)->submit(syncCpu != 0 ? GrSyncCpu::kYes : GrSyncCpu::kNo);
}

void GrContext_flushAndSubmit(void* context, int syncCpu) {
	if (!context) return;
	static_cast<GrDirectContext*>(context)->flushAndSubmit(syncCpu != 0 ? GrSyncCpu::kYes : GrSyncCpu::kNo);
}

uint32_t GrContext_getResourceCacheLimitBytes(void* context) {
	if (!context) return 0;
	return static_cast<uint32_t>(static_cast<GrDirectContext*>(context)->getResourceCacheLimit());
}

uint32_t GrContext_getResourceCacheUsageBytes(void* context) {
	if (!context) return 0;
	int count = 0;
	size_t bytes = 0;
	static_cast<GrDirectContext*>(context)->getResourceCacheUsage(&count, &bytes);
	return static_cast<uint32_t>(bytes);
}

void GrContext_setResourceCacheLimitBytes(void* context, uint32_t maxResourceBytes) {
	if (!context) return;
	static_cast<GrDirectContext*>(context)->setResourceCacheLimit(static_cast<size_t>(maxResourceBytes));
}

void GrContext_releaseResourcesAndAbandonContext(void* context) {
	if (!context) return;
	static_cast<GrDirectContext*>(context)->releaseResourcesAndAbandonContext();
}

void GrContext_freeGpuResources(void* context) {
	if (!context) return;
	static_cast<GrDirectContext*>(context)->freeGpuResources();
}

void GrContext_performDeferredCleanup(void* context, long msNotUsed) {
	if (!context) return;
	static_cast<GrDirectContext*>(context)->performDeferredCleanup(
		std::chrono::milliseconds(msNotUsed)
	);
}

// Surface helpers (CPU + GL fallback).
void* MakeSWCanvasSurface(int width, int height) {
	SkImageInfo info = SkImageInfo::MakeN32Premul(width, height, SkColorSpace::MakeSRGB());
	auto surface = SkSurfaces::Raster(info);
	return surface.release();
}

void* MakeCanvasSurface(int width, int height) {
	WebGLContextState* state = CurrentWebGLState();
	if (state && state->context) {
		auto surface = MakeOnScreenGLSurface(state->context, width, height, nullptr);
		if (surface) return surface.release();
	}
	return MakeSWCanvasSurface(width, height);
}

void* Surface_makeImageSnapshot(void* surface) {
	if (!surface) return nullptr;
	auto image = static_cast<SkSurface*>(surface)->makeImageSnapshot();
	return image.release();
}

void* Surface_encodeToPNG(void* surface) {
	if (!surface) return nullptr;
	return SkData::MakeEmpty().release();
}

int Surface_readPixelsRGBA8888(void* surface, int x, int y, int w, int h, void* dst, int dstRowBytes) {
	if (!surface || !dst || w <= 0 || h <= 0) return 0;
	SkImageInfo info = SkImageInfo::Make(w, h, kRGBA_8888_SkColorType, kPremul_SkAlphaType);
	return static_cast<SkSurface*>(surface)->readPixels(info, dst, dstRowBytes, x, y) ? 1 : 0;
}

struct SurfaceTextureInfo {
	int width;
	int height;
	int colorType;
	int alphaType;
};

void* Surface_makeImageFromTexture(void* surface, uint32_t webglHandle, uint32_t texHandle, void* infoPtr) {
	(void)surface;
	(void)webglHandle;
	if (!infoPtr || texHandle == 0) return nullptr;
	WebGLContextState* state = CurrentWebGLState();
	if (!state || !state->context) return nullptr;

	const auto* info = static_cast<const SurfaceTextureInfo*>(infoPtr);
	if (!info || info->width <= 0 || info->height <= 0) return nullptr;

	GrGLTextureInfo texInfo;
	texInfo.fID = texHandle;
	texInfo.fTarget = GR_GL_TEXTURE_2D;
	texInfo.fFormat = GR_GL_RGBA8;

	GrBackendTexture backendTexture = GrBackendTextures::MakeGL(info->width, info->height, skgpu::Mipmapped::kNo, texInfo);
	SkImageInfo imageInfo = SkImageInfo::Make(
		info->width,
		info->height,
		static_cast<SkColorType>(info->colorType),
		static_cast<SkAlphaType>(info->alphaType)
	);

	auto image = SkImages::BorrowTextureFrom(
		state->context.get(),
		backendTexture,
		kBottomLeft_GrSurfaceOrigin,
		imageInfo.colorType(),
		imageInfo.alphaType(),
		imageInfo.refColorSpace()
	);
	return image.release();
}

// Data helpers
void* Data_bytes(void* data) {
	if (!data) return nullptr;
	return const_cast<void*>(static_cast<SkData*>(data)->data());
}

int Data_size(void* data) {
	if (!data) return 0;
	return static_cast<int>(static_cast<SkData*>(data)->size());
}

void DeleteData(void* data) {
	SkSafeUnref(static_cast<SkData*>(data));
}

// Paint helpers
void* MakePaint() {
	return new SkPaint();
}

void DeletePaint(void* paint) {
	delete static_cast<SkPaint*>(paint);
}

void* Paint_copy(void* paint) {
	if (!paint) return nullptr;
	return new SkPaint(*static_cast<SkPaint*>(paint));
}

void Paint_setColor(void* paint, uint32_t argb) {
	if (!paint) return;
	static_cast<SkPaint*>(paint)->setColor(static_cast<SkColor>(argb));
}

void Paint_setColor4f(void* paint, float r, float g, float b, float a) {
	if (!paint) return;
	SkColor4f color = { r, g, b, a };
	auto colorSpace = SkColorSpace::MakeSRGB();
	static_cast<SkPaint*>(paint)->setColor4f(color, colorSpace.get());
}

uint32_t Paint_getColor(void* paint) {
	if (!paint) return 0;
	return static_cast<uint32_t>(static_cast<SkPaint*>(paint)->getColor());
}

void Paint_setAntiAlias(void* paint, int aa) {
	if (!paint) return;
	static_cast<SkPaint*>(paint)->setAntiAlias(aa != 0);
}

int Paint_isAntiAlias(void* paint) {
	if (!paint) return 0;
	return static_cast<SkPaint*>(paint)->isAntiAlias() ? 1 : 0;
}

void Paint_setDither(void* paint, int dither) {
	if (!paint) return;
	static_cast<SkPaint*>(paint)->setDither(dither != 0);
}

int Paint_isDither(void* paint) {
	if (!paint) return 0;
	return static_cast<SkPaint*>(paint)->isDither() ? 1 : 0;
}

void Paint_setStyle(void* paint, int style) {
	if (!paint) return;
	static_cast<SkPaint*>(paint)->setStyle(ToPaintStyle(style));
}

int Paint_getStyle(void* paint) {
	if (!paint) return 0;
	return static_cast<int>(static_cast<SkPaint*>(paint)->getStyle());
}

void Paint_setStrokeWidth(void* paint, float width) {
	if (!paint) return;
	static_cast<SkPaint*>(paint)->setStrokeWidth(width);
}

float Paint_getStrokeWidth(void* paint) {
	if (!paint) return 0.0f;
	return static_cast<SkPaint*>(paint)->getStrokeWidth();
}

void Paint_setStrokeCap(void* paint, int cap) {
	if (!paint) return;
	static_cast<SkPaint*>(paint)->setStrokeCap(ToStrokeCap(cap));
}

int Paint_getStrokeCap(void* paint) {
	if (!paint) return 0;
	return static_cast<int>(static_cast<SkPaint*>(paint)->getStrokeCap());
}

void Paint_setStrokeJoin(void* paint, int join) {
	if (!paint) return;
	static_cast<SkPaint*>(paint)->setStrokeJoin(ToStrokeJoin(join));
}

int Paint_getStrokeJoin(void* paint) {
	if (!paint) return 0;
	return static_cast<int>(static_cast<SkPaint*>(paint)->getStrokeJoin());
}

void Paint_setStrokeMiter(void* paint, float miter) {
	if (!paint) return;
	static_cast<SkPaint*>(paint)->setStrokeMiter(miter);
}

float Paint_getStrokeMiter(void* paint) {
	if (!paint) return 0.0f;
	return static_cast<SkPaint*>(paint)->getStrokeMiter();
}

void Paint_setAlphaf(void* paint, float a) {
	if (!paint) return;
	static_cast<SkPaint*>(paint)->setAlphaf(a);
}

float Paint_getAlphaf(void* paint) {
	if (!paint) return 0.0f;
	return static_cast<SkPaint*>(paint)->getAlphaf();
}

void Paint_setBlendMode(void* paint, int mode) {
	if (!paint) return;
	static_cast<SkPaint*>(paint)->setBlendMode(ToBlendMode(mode));
}

int Paint_getBlendMode(void* paint) {
	if (!paint) return 0;
	const auto mode = static_cast<SkPaint*>(paint)->getBlendMode_or(SkBlendMode::kSrcOver);
	return static_cast<int>(mode);
}

void Paint_setShader(void* paint, void* shader) {
	if (!paint) return;
	auto* skShader = static_cast<SkShader*>(shader);
	static_cast<SkPaint*>(paint)->setShader(sk_ref_sp(skShader));
}

void Paint_setColorFilter(void* paint, void* colorFilter) {
	if (!paint) return;
	auto* filter = static_cast<SkColorFilter*>(colorFilter);
	static_cast<SkPaint*>(paint)->setColorFilter(sk_ref_sp(filter));
}

void Paint_setMaskFilter(void* paint, void* maskFilter) {
	if (!paint) return;
	auto* filter = static_cast<SkMaskFilter*>(maskFilter);
	static_cast<SkPaint*>(paint)->setMaskFilter(sk_ref_sp(filter));
}

void Paint_setPathEffect(void* paint, void* pathEffect) {
	if (!paint) return;
	auto* effect = static_cast<SkPathEffect*>(pathEffect);
	static_cast<SkPaint*>(paint)->setPathEffect(sk_ref_sp(effect));
}

void Paint_setImageFilter(void* paint, void* imageFilter) {
	if (!paint) return;
	auto* filter = static_cast<SkImageFilter*>(imageFilter);
	static_cast<SkPaint*>(paint)->setImageFilter(sk_ref_sp(filter));
}

// Path helpers
void* MakePath() {
	return new CheapPath();
}

void DeletePath(void* ptr) {
	delete static_cast<CheapPath*>(ptr);
}

void Path_setFillType(void* ptr, int fillType) {
	if (!ptr) return;
	static_cast<CheapPath*>(ptr)->builder.setFillType(ToPathFillType(fillType));
}

void Path_moveTo(void* ptr, float x, float y) {
	if (!ptr) return;
	static_cast<CheapPath*>(ptr)->builder.moveTo(x, y);
}

void Path_lineTo(void* ptr, float x, float y) {
	if (!ptr) return;
	static_cast<CheapPath*>(ptr)->builder.lineTo(x, y);
}

void Path_close(void* ptr) {
	if (!ptr) return;
	static_cast<CheapPath*>(ptr)->builder.close();
}

void Path_reset(void* ptr) {
	if (!ptr) return;
	static_cast<CheapPath*>(ptr)->builder.reset();
}

void Path_getBounds(void* ptr, void* outLTRB4Ptr) {
	if (!ptr || !outLTRB4Ptr) return;
	SkRect bounds = static_cast<CheapPath*>(ptr)->builder.snapshot().getBounds();
	WriteRectLTRB(static_cast<float*>(outLTRB4Ptr), bounds);
}

void Path_quadTo(void* ptr, float x1, float y1, float x2, float y2) {
	if (!ptr) return;
	static_cast<CheapPath*>(ptr)->builder.quadTo(x1, y1, x2, y2);
}

void Path_cubicTo(void* ptr, float x1, float y1, float x2, float y2, float x3, float y3) {
	if (!ptr) return;
	static_cast<CheapPath*>(ptr)->builder.cubicTo(x1, y1, x2, y2, x3, y3);
}

void Path_addRect(void* ptr, float l, float t, float r, float b) {
	if (!ptr) return;
	static_cast<CheapPath*>(ptr)->builder.addRect(SkRect::MakeLTRB(l, t, r, b));
}

void Path_addCircle(void* ptr, float cx, float cy, float r) {
	if (!ptr) return;
	static_cast<CheapPath*>(ptr)->builder.addCircle(cx, cy, r);
}

void Path_addOval(void* ptr, float l, float t, float r, float b, int dir, int startIndex) {
	if (!ptr) return;
	static_cast<CheapPath*>(ptr)->builder.addOval(SkRect::MakeLTRB(l, t, r, b), ToPathDirection(dir), startIndex);
}

void Path_addRRectXY(void* ptr, float l, float t, float r, float b, float rx, float ry, int dir, int startIndex) {
	if (!ptr) return;
	SkRRect rr;
	rr.setRectXY(SkRect::MakeLTRB(l, t, r, b), rx, ry);
	static_cast<CheapPath*>(ptr)->builder.addRRect(rr, ToPathDirection(dir), startIndex);
}

void Path_addPolygon(void* ptr, void* pointsXYPtr, int pointCount, int close) {
	if (!ptr || !pointsXYPtr || pointCount <= 0) return;
	const auto* pts = static_cast<const SkPoint*>(pointsXYPtr);
	static_cast<CheapPath*>(ptr)->builder.addPolygon(SkSpan<const SkPoint>(pts, pointCount), close != 0);
}

void Path_addArc(void* ptr, float l, float t, float r, float b, float startAngleDeg, float sweepAngleDeg) {
	if (!ptr) return;
	static_cast<CheapPath*>(ptr)->builder.addArc(SkRect::MakeLTRB(l, t, r, b), startAngleDeg, sweepAngleDeg);
}

void Path_arcToOval(void* ptr, float l, float t, float r, float b, float startAngleDeg, float sweepAngleDeg, int forceMoveTo) {
	if (!ptr) return;
	static_cast<CheapPath*>(ptr)->builder.arcTo(SkRect::MakeLTRB(l, t, r, b), startAngleDeg, sweepAngleDeg, forceMoveTo != 0);
}

void* Path_snapshot(void* ptr) {
	if (!ptr) return nullptr;
	SkPath snapshot = static_cast<CheapPath*>(ptr)->builder.snapshot();
	return new SkPath(std::move(snapshot));
}

void DeleteSkPath(void* skPath) {
	delete static_cast<SkPath*>(skPath);
}

void Path_transform(void* skPath, void* m9Ptr) {
	if (!skPath || !m9Ptr) return;
	SkMatrix matrix = ReadMatrix9(static_cast<float*>(m9Ptr));
	auto* path = static_cast<SkPath*>(skPath);
	*path = path->makeTransform(matrix);
}

void SkPath_getBounds(void* skPath, void* outLTRB4Ptr) {
	if (!skPath || !outLTRB4Ptr) return;
	SkRect bounds = static_cast<SkPath*>(skPath)->getBounds();
	WriteRectLTRB(static_cast<float*>(outLTRB4Ptr), bounds);
}

// Canvas helpers
void Canvas_clear(void* canvas, uint32_t argb) {
	if (!canvas) return;
	static_cast<SkCanvas*>(canvas)->clear(static_cast<SkColor>(argb));
}

int Canvas_getSaveCount(void* canvas) {
	if (!canvas) return 0;
	return static_cast<SkCanvas*>(canvas)->getSaveCount();
}

int Canvas_saveLayer(void* canvas, float l, float t, float r, float b, int hasBounds, void* paint) {
	if (!canvas) return 0;
	SkRect bounds = SkRect::MakeLTRB(l, t, r, b);
	SkCanvas::SaveLayerRec rec;
	if (hasBounds) {
		rec.fBounds = &bounds;
	}
	if (paint) {
		rec.fPaint = static_cast<SkPaint*>(paint);
	}
	return static_cast<SkCanvas*>(canvas)->saveLayer(rec);
}

int Canvas_save(void* canvas) {
	if (!canvas) return 0;
	return static_cast<SkCanvas*>(canvas)->save();
}

void Canvas_restore(void* canvas) {
	if (!canvas) return;
	static_cast<SkCanvas*>(canvas)->restore();
}

void Canvas_restoreToCount(void* canvas, int saveCount) {
	if (!canvas) return;
	static_cast<SkCanvas*>(canvas)->restoreToCount(saveCount);
}

void Canvas_translate(void* canvas, float dx, float dy) {
	if (!canvas) return;
	static_cast<SkCanvas*>(canvas)->translate(dx, dy);
}

void Canvas_scale(void* canvas, float sx, float sy) {
	if (!canvas) return;
	static_cast<SkCanvas*>(canvas)->scale(sx, sy);
}

void Canvas_rotate(void* canvas, float degrees) {
	if (!canvas) return;
	static_cast<SkCanvas*>(canvas)->rotate(degrees);
}

void Canvas_drawOval(void* canvas, float l, float t, float r, float b, void* paint) {
	if (!canvas) return;
	static_cast<SkCanvas*>(canvas)->drawOval(SkRect::MakeLTRB(l, t, r, b), *static_cast<SkPaint*>(paint));
}

void Canvas_drawArc(void* canvas, float l, float t, float r, float b, float startAngle, float sweepAngle, int useCenter, void* paint) {
	if (!canvas) return;
	static_cast<SkCanvas*>(canvas)->drawArc(SkRect::MakeLTRB(l, t, r, b), startAngle, sweepAngle, useCenter != 0, *static_cast<SkPaint*>(paint));
}

void Canvas_drawPaint(void* canvas, void* paint) {
	if (!canvas || !paint) return;
	static_cast<SkCanvas*>(canvas)->drawPaint(*static_cast<SkPaint*>(paint));
}

void Canvas_concat(void* canvas, void* m9Ptr) {
	if (!canvas || !m9Ptr) return;
	static_cast<SkCanvas*>(canvas)->concat(ReadMatrix9(static_cast<float*>(m9Ptr)));
}

void Canvas_setMatrix(void* canvas, void* m9Ptr) {
	if (!canvas || !m9Ptr) return;
	static_cast<SkCanvas*>(canvas)->setMatrix(ReadMatrix9(static_cast<float*>(m9Ptr)));
}

void Canvas_clipRect(void* canvas, float l, float t, float r, float b, int clipOp, int doAA) {
	if (!canvas) return;
	static_cast<SkCanvas*>(canvas)->clipRect(SkRect::MakeLTRB(l, t, r, b), static_cast<SkClipOp>(clipOp), doAA != 0);
}

void Canvas_drawRect(void* canvas, float l, float t, float r, float b, void* paint) {
	if (!canvas) return;
	static_cast<SkCanvas*>(canvas)->drawRect(SkRect::MakeLTRB(l, t, r, b), *static_cast<SkPaint*>(paint));
}

void Canvas_drawPath(void* canvas, void* path, void* paint) {
	if (!canvas || !path) return;
	SkPath snapshot = static_cast<CheapPath*>(path)->builder.snapshot();
	static_cast<SkCanvas*>(canvas)->drawPath(snapshot, *static_cast<SkPaint*>(paint));
}

void Canvas_drawSkPath(void* canvas, void* skPath, void* paint) {
	if (!canvas || !skPath) return;
	static_cast<SkCanvas*>(canvas)->drawPath(*static_cast<SkPath*>(skPath), *static_cast<SkPaint*>(paint));
}

void Canvas_drawCircle(void* canvas, float cx, float cy, float radius, void* paint) {
	if (!canvas) return;
	static_cast<SkCanvas*>(canvas)->drawCircle(cx, cy, radius, *static_cast<SkPaint*>(paint));
}

void Canvas_drawLine(void* canvas, float x0, float y0, float x1, float y1, void* paint) {
	if (!canvas) return;
	static_cast<SkCanvas*>(canvas)->drawLine(x0, y0, x1, y1, *static_cast<SkPaint*>(paint));
}

void Canvas_drawImage(void* canvas, void* image, float x, float y, int filterMode, int mipmapMode) {
	if (!canvas || !image) return;
	static_cast<SkCanvas*>(canvas)->drawImage(static_cast<SkImage*>(image), x, y, SamplingFrom(filterMode, mipmapMode), nullptr);
}

void Canvas_drawImageWithPaint(void* canvas, void* image, float x, float y, int filterMode, int mipmapMode, void* paint) {
	if (!canvas || !image) return;
	static_cast<SkCanvas*>(canvas)->drawImage(static_cast<SkImage*>(image), x, y, SamplingFrom(filterMode, mipmapMode), static_cast<SkPaint*>(paint));
}

void Canvas_drawImageRect(
	void* canvas,
	void* image,
	float srcL,
	float srcT,
	float srcR,
	float srcB,
	float dstL,
	float dstT,
	float dstR,
	float dstB,
	int filterMode,
	int mipmapMode
) {
	if (!canvas || !image) return;
	SkRect src = SkRect::MakeLTRB(srcL, srcT, srcR, srcB);
	SkRect dst = SkRect::MakeLTRB(dstL, dstT, dstR, dstB);
	static_cast<SkCanvas*>(canvas)->drawImageRect(
		static_cast<SkImage*>(image),
		src,
		dst,
		SamplingFrom(filterMode, mipmapMode),
		nullptr,
		SkCanvas::kFast_SrcRectConstraint
	);
}

void Canvas_drawImageRectWithPaint(
	void* canvas,
	void* image,
	float srcL,
	float srcT,
	float srcR,
	float srcB,
	float dstL,
	float dstT,
	float dstR,
	float dstB,
	int filterMode,
	int mipmapMode,
	void* paint
) {
	if (!canvas || !image) return;
	SkRect src = SkRect::MakeLTRB(srcL, srcT, srcR, srcB);
	SkRect dst = SkRect::MakeLTRB(dstL, dstT, dstR, dstB);
	static_cast<SkCanvas*>(canvas)->drawImageRect(
		static_cast<SkImage*>(image),
		src,
		dst,
		SamplingFrom(filterMode, mipmapMode),
		static_cast<SkPaint*>(paint),
		SkCanvas::kFast_SrcRectConstraint
	);
}

void Canvas_drawTextBlob(void* canvas, void* blob, float x, float y, void* paint) {
	if (!canvas || !blob || !paint) return;
	static_cast<SkCanvas*>(canvas)->drawTextBlob(static_cast<SkTextBlob*>(blob), x, y, *static_cast<SkPaint*>(paint));
}

void Canvas_drawParagraph(void* canvas, void* paragraph, float x, float y) {
	if (!canvas || !paragraph) return;
	static_cast<skia::textlayout::Paragraph*>(paragraph)->paint(static_cast<SkCanvas*>(canvas), x, y);
}

void Canvas_clipPath(void* canvas, void* path, int clipOp, int doAA) {
	if (!canvas || !path) return;
	static_cast<SkCanvas*>(canvas)->clipPath(*static_cast<SkPath*>(path), static_cast<SkClipOp>(clipOp), doAA != 0);
}

void Canvas_clipRRect(void* canvas, float l, float t, float r, float b, float radiusX, float radiusY, int clipOp, int doAA) {
	if (!canvas) return;
	SkRRect rr;
	rr.setRectXY(SkRect::MakeLTRB(l, t, r, b), radiusX, radiusY);
	static_cast<SkCanvas*>(canvas)->clipRRect(rr, static_cast<SkClipOp>(clipOp), doAA != 0);
}

void Canvas_drawRRect(void* canvas, float l, float t, float r, float b, float radiusX, float radiusY, void* paint) {
	if (!canvas) return;
	SkRRect rr;
	rr.setRectXY(SkRect::MakeLTRB(l, t, r, b), radiusX, radiusY);
	static_cast<SkCanvas*>(canvas)->drawRRect(rr, *static_cast<SkPaint*>(paint));
}

void Canvas_drawDRRect(
	void* canvas,
	float outerL,
	float outerT,
	float outerR,
	float outerB,
	float outerRadiusX,
	float outerRadiusY,
	float innerL,
	float innerT,
	float innerR,
	float innerB,
	float innerRadiusX,
	float innerRadiusY,
	void* paint
) {
	if (!canvas) return;
	SkRRect outer;
	outer.setRectXY(SkRect::MakeLTRB(outerL, outerT, outerR, outerB), outerRadiusX, outerRadiusY);
	SkRRect inner;
	inner.setRectXY(SkRect::MakeLTRB(innerL, innerT, innerR, innerB), innerRadiusX, innerRadiusY);
	static_cast<SkCanvas*>(canvas)->drawDRRect(outer, inner, *static_cast<SkPaint*>(paint));
}

void Canvas_drawPoints(void* canvas, int mode, void* pointsPtr, int count, void* paint) {
	if (!canvas || !pointsPtr || count <= 0) return;
	const auto* pts = static_cast<const SkPoint*>(pointsPtr);
	static_cast<SkCanvas*>(canvas)->drawPoints(ToPointMode(mode), SkSpan<const SkPoint>(pts, count), *static_cast<SkPaint*>(paint));
}

void Canvas_drawVertices(
	void* canvas,
	int mode,
	void* positionsPtr,
	void* texCoordsPtr,
	void* colorsPtr,
	int vertexCount,
	void* indicesPtr,
	int indexCount,
	int blendMode,
	void* paint
) {
	if (!canvas || !positionsPtr || vertexCount <= 0) return;
	const auto* positions = static_cast<const SkPoint*>(positionsPtr);
	const auto* texCoords = static_cast<const SkPoint*>(texCoordsPtr);
	const auto* colors = static_cast<const SkColor*>(colorsPtr);
	const auto* indices = static_cast<const uint16_t*>(indicesPtr);

	auto vertices = SkVertices::MakeCopy(
		ToVertexMode(mode),
		vertexCount,
		positions,
		texCoords,
		colors,
		indexCount,
		indices
	);
	if (!vertices) return;
	static_cast<SkCanvas*>(canvas)->drawVertices(vertices, ToBlendMode(blendMode), *static_cast<SkPaint*>(paint));
}

void Canvas_skew(void* canvas, float sx, float sy) {
	if (!canvas) return;
	static_cast<SkCanvas*>(canvas)->skew(sx, sy);
}

void Canvas_resetMatrix(void* canvas) {
	if (!canvas) return;
	static_cast<SkCanvas*>(canvas)->resetMatrix();
}

void Canvas_getLocalToDevice(void* canvas, void* outPtr) {
	if (!canvas || !outPtr) return;
	SkMatrix matrix = static_cast<SkCanvas*>(canvas)->getLocalToDeviceAs3x3();
	WriteMatrix9(static_cast<float*>(outPtr), matrix);
}

void Canvas_getTotalMatrix(void* canvas, void* outPtr) {
	if (!canvas || !outPtr) return;
	SkMatrix matrix = static_cast<SkCanvas*>(canvas)->getTotalMatrix();
	WriteMatrix9(static_cast<float*>(outPtr), matrix);
}

void Canvas_getDeviceClipBounds(void* canvas, void* outPtr) {
	if (!canvas || !outPtr) return;
	SkIRect bounds = static_cast<SkCanvas*>(canvas)->getDeviceClipBounds();
	WriteRectLTRB(static_cast<float*>(outPtr), SkRect::Make(bounds));
}

void Canvas_getLocalClipBounds(void* canvas, void* outPtr) {
	if (!canvas || !outPtr) return;
	SkRect bounds = static_cast<SkCanvas*>(canvas)->getLocalClipBounds();
	WriteRectLTRB(static_cast<float*>(outPtr), bounds);
}

int Canvas_quickRejectRect(void* canvas, float l, float t, float r, float b) {
	if (!canvas) return 0;
	return static_cast<SkCanvas*>(canvas)->quickReject(SkRect::MakeLTRB(l, t, r, b)) ? 1 : 0;
}

int Canvas_quickRejectPath(void* canvas, void* path) {
	if (!canvas || !path) return 0;
	SkPath snapshot = static_cast<CheapPath*>(path)->builder.snapshot();
	return static_cast<SkCanvas*>(canvas)->quickReject(snapshot) ? 1 : 0;
}

// Image helpers
void* MakeImageFromEncoded(void* bytesPtr, int size) {
	if (!bytesPtr || size <= 0) return nullptr;
	auto data = SkData::MakeWithCopy(bytesPtr, static_cast<size_t>(size));
	if (!data) return nullptr;
	auto image = SkImages::DeferredFromEncodedData(std::move(data));
	return image.release();
}

void* MakeImageFromRGBA8888(void* pixelsPtr, int width, int height) {
	if (!pixelsPtr || width <= 0 || height <= 0) return nullptr;
	SkImageInfo info = SkImageInfo::Make(width, height, kRGBA_8888_SkColorType, kPremul_SkAlphaType);
	size_t rowBytes = static_cast<size_t>(width) * 4;
	size_t size = rowBytes * static_cast<size_t>(height);
	auto data = SkData::MakeWithCopy(pixelsPtr, size);
	if (!data) return nullptr;
	auto image = SkImages::RasterFromData(info, std::move(data), rowBytes);
	return image.release();
}

void DeleteImage(void* image) {
	SkSafeUnref(static_cast<SkImage*>(image));
}

int Image_width(void* image) {
	if (!image) return 0;
	return static_cast<SkImage*>(image)->width();
}

int Image_height(void* image) {
	if (!image) return 0;
	return static_cast<SkImage*>(image)->height();
}

int Image_alphaType(void* image) {
	if (!image) return 0;
	return static_cast<int>(static_cast<SkImage*>(image)->alphaType());
}

int Image_colorType(void* image) {
	if (!image) return 0;
	return static_cast<int>(static_cast<SkImage*>(image)->colorType());
}

void* Image_makeShader(void* image, int tileModeX, int tileModeY, int filterMode, int mipmapMode, void* matrixPtr) {
	if (!image) return nullptr;
	SkMatrix matrix = ReadMatrix9(static_cast<float*>(matrixPtr));
	auto shader = static_cast<SkImage*>(image)->makeShader(
		ToTileMode(tileModeX),
		ToTileMode(tileModeY),
		SamplingFrom(filterMode, mipmapMode),
		&matrix
	);
	return shader.release();
}

int Image_readPixelsRGBA8888(void* image, int x, int y, int w, int h, void* dst, int dstRowBytes) {
	if (!image || !dst || w <= 0 || h <= 0) return 0;
	SkImageInfo info = SkImageInfo::Make(w, h, kRGBA_8888_SkColorType, kPremul_SkAlphaType);
	return static_cast<SkImage*>(image)->readPixels(info, dst, dstRowBytes, x, y) ? 1 : 0;
}

void* Image_encodeToPNG(void* image) {
	if (!image) return nullptr;
	return SkData::MakeEmpty().release();
}

// Shader helpers
void DeleteShader(void* shader) {
	SkSafeUnref(static_cast<SkShader*>(shader));
}

void* MakeColorShader(uint32_t argb) {
	auto shader = SkShaders::Color(static_cast<SkColor>(argb));
	return shader.release();
}

void* MakeLinearGradientShader(float x0, float y0, float x1, float y1, void* colorsPtr, void* positionsPtr, int count, int tileMode) {
	if (!colorsPtr || count <= 0) return nullptr;
	const auto* colors = static_cast<const SkColor*>(colorsPtr);
	const auto* positions = static_cast<const SkScalar*>(positionsPtr);
	SkPoint pts[2] = { { x0, y0 }, { x1, y1 } };
	auto shader = SkGradientShader::MakeLinear(pts, colors, positions, count, ToTileMode(tileMode));
	return shader.release();
}

void* MakeRadialGradientShader(float cx, float cy, float radius, void* colorsPtr, void* positionsPtr, int count, int tileMode) {
	if (!colorsPtr || count <= 0) return nullptr;
	const auto* colors = static_cast<const SkColor*>(colorsPtr);
	const auto* positions = static_cast<const SkScalar*>(positionsPtr);
	auto shader = SkGradientShader::MakeRadial({ cx, cy }, radius, colors, positions, count, ToTileMode(tileMode));
	return shader.release();
}

void* MakeSweepGradientShader(float cx, float cy, void* colorsPtr, void* positionsPtr, int count, int tileMode, float startAngle, float endAngle) {
	if (!colorsPtr || count <= 0) return nullptr;
	const auto* colors = static_cast<const SkColor*>(colorsPtr);
	const auto* positions = static_cast<const SkScalar*>(positionsPtr);
	auto shader = SkGradientShader::MakeSweep(cx, cy, colors, positions, count, ToTileMode(tileMode), startAngle, endAngle, 0, nullptr);
	return shader.release();
}

void* MakeTwoPointConicalGradientShader(
	float startX,
	float startY,
	float startRadius,
	float endX,
	float endY,
	float endRadius,
	void* colorsPtr,
	void* positionsPtr,
	int count,
	int tileMode
) {
	if (!colorsPtr || count <= 0) return nullptr;
	const auto* colors = static_cast<const SkColor*>(colorsPtr);
	const auto* positions = static_cast<const SkScalar*>(positionsPtr);
	auto shader = SkGradientShader::MakeTwoPointConical(
		{ startX, startY },
		startRadius,
		{ endX, endY },
		endRadius,
		colors,
		positions,
		count,
		ToTileMode(tileMode)
	);
	return shader.release();
}

void* MakeImageShader(void* image, int tileModeX, int tileModeY, int filterMode, int mipmapMode, void* matrixPtr) {
	if (!image) return nullptr;
	SkMatrix matrix = ReadMatrix9(static_cast<float*>(matrixPtr));
	auto shader = static_cast<SkImage*>(image)->makeShader(
		ToTileMode(tileModeX),
		ToTileMode(tileModeY),
		SamplingFrom(filterMode, mipmapMode),
		&matrix
	);
	return shader.release();
}

// Color filters
void DeleteColorFilter(void* filter) {
	SkSafeUnref(static_cast<SkColorFilter*>(filter));
}

void* MakeBlendColorFilter(uint32_t argb, int blendMode) {
	auto filter = SkColorFilters::Blend(static_cast<SkColor>(argb), ToBlendMode(blendMode));
	return filter.release();
}

void* MakeMatrixColorFilter(void* matrixPtr) {
	if (!matrixPtr) return nullptr;
	const auto* matrix = static_cast<const float*>(matrixPtr);
	auto filter = SkColorFilters::Matrix(matrix);
	return filter.release();
}

void* MakeComposeColorFilter(void* outer, void* inner) {
	auto filter = SkColorFilters::Compose(sk_ref_sp(static_cast<SkColorFilter*>(outer)), sk_ref_sp(static_cast<SkColorFilter*>(inner)));
	return filter.release();
}

void* MakeLerpColorFilter(float t, void* dst, void* src) {
	auto filter = SkColorFilters::Lerp(t, sk_ref_sp(static_cast<SkColorFilter*>(dst)), sk_ref_sp(static_cast<SkColorFilter*>(src)));
	return filter.release();
}

void* MakeSRGBToLinearGammaColorFilter() {
	auto filter = SkColorFilters::SRGBToLinearGamma();
	return filter.release();
}

void* MakeLinearToSRGBGammaColorFilter() {
	auto filter = SkColorFilters::LinearToSRGBGamma();
	return filter.release();
}

// Mask filter
void DeleteMaskFilter(void* filter) {
	SkSafeUnref(static_cast<SkMaskFilter*>(filter));
}

void* MakeBlurMaskFilter(int style, float sigma) {
	auto filter = SkMaskFilter::MakeBlur(ToBlurStyle(style), sigma);
	return filter.release();
}

// Path effects
void DeletePathEffect(void* pathEffect) {
	SkSafeUnref(static_cast<SkPathEffect*>(pathEffect));
}

void* MakeDashPathEffect(void* intervalsPtr, int count, float phase) {
	if (!intervalsPtr || count <= 0) return nullptr;
	const auto* intervals = static_cast<const SkScalar*>(intervalsPtr);
	auto effect = SkDashPathEffect::Make(SkSpan<const SkScalar>(intervals, count), phase);
	return effect.release();
}

void* MakeDiscretePathEffect(float segLength, float deviation, uint32_t seed) {
	auto effect = SkDiscretePathEffect::Make(segLength, deviation, seed);
	return effect.release();
}

void* MakeCornerPathEffect(float radius) {
	auto effect = SkCornerPathEffect::Make(radius);
	return effect.release();
}

void* MakeComposePathEffect(void* outer, void* inner) {
	auto effect = SkPathEffect::MakeCompose(sk_ref_sp(static_cast<SkPathEffect*>(outer)), sk_ref_sp(static_cast<SkPathEffect*>(inner)));
	return effect.release();
}

void* MakeSumPathEffect(void* first, void* second) {
	auto effect = SkPathEffect::MakeSum(sk_ref_sp(static_cast<SkPathEffect*>(first)), sk_ref_sp(static_cast<SkPathEffect*>(second)));
	return effect.release();
}

// Image filters
void DeleteImageFilter(void* filter) {
	SkSafeUnref(static_cast<SkImageFilter*>(filter));
}

void* MakeBlurImageFilter(float sigmaX, float sigmaY, int tileMode, void* input) {
	auto filter = SkImageFilters::Blur(sigmaX, sigmaY, ToTileMode(tileMode), sk_ref_sp(static_cast<SkImageFilter*>(input)));
	return filter.release();
}

void* MakeColorFilterImageFilter(void* colorFilter, void* input) {
	auto filter = SkImageFilters::ColorFilter(sk_ref_sp(static_cast<SkColorFilter*>(colorFilter)), sk_ref_sp(static_cast<SkImageFilter*>(input)));
	return filter.release();
}

void* MakeComposeImageFilter(void* outer, void* inner) {
	auto filter = SkImageFilters::Compose(sk_ref_sp(static_cast<SkImageFilter*>(outer)), sk_ref_sp(static_cast<SkImageFilter*>(inner)));
	return filter.release();
}

void* MakeDropShadowImageFilter(float dx, float dy, float sigmaX, float sigmaY, uint32_t argb, void* input) {
	auto filter = SkImageFilters::DropShadow(dx, dy, sigmaX, sigmaY, static_cast<SkColor>(argb), sk_ref_sp(static_cast<SkImageFilter*>(input)));
	return filter.release();
}

void* MakeDropShadowOnlyImageFilter(float dx, float dy, float sigmaX, float sigmaY, uint32_t argb, void* input) {
	auto filter = SkImageFilters::DropShadowOnly(dx, dy, sigmaX, sigmaY, static_cast<SkColor>(argb), sk_ref_sp(static_cast<SkImageFilter*>(input)));
	return filter.release();
}

// Paragraph helpers
void* MakeParagraphBuilder(
	void* fontBytesPtr,
	int fontByteLength,
	float fontSize,
	uint32_t color,
	int textAlign,
	int maxLines
) {
	auto builder = MakeParagraphBuilderInternal(fontBytesPtr, fontByteLength, fontSize, color, textAlign, maxLines, nullptr, 0);
	return builder.release();
}

void* MakeParagraphBuilderWithEllipsis(
	void* fontBytesPtr,
	int fontByteLength,
	float fontSize,
	uint32_t color,
	int textAlign,
	int maxLines,
	const char* ellipsisUtf8,
	int ellipsisByteLength
) {
	auto builder = MakeParagraphBuilderInternal(fontBytesPtr, fontByteLength, fontSize, color, textAlign, maxLines, ellipsisUtf8, ellipsisByteLength);
	return builder.release();
}

void ParagraphBuilder_pushStyle(void* builder, float fontSize, uint32_t color) {
	if (!builder) return;
	auto* b = static_cast<skia::textlayout::ParagraphBuilder*>(builder);
	auto style = b->peekStyle();
	style.setFontSize(fontSize);
	style.setColor(static_cast<SkColor>(color));
	b->pushStyle(style);
}

void ParagraphBuilder_pop(void* builder) {
	if (!builder) return;
	static_cast<skia::textlayout::ParagraphBuilder*>(builder)->pop();
}

void ParagraphBuilder_addText(void* builder, const char* utf8Ptr, int byteLength) {
	if (!builder || !utf8Ptr || byteLength <= 0) return;
	static_cast<skia::textlayout::ParagraphBuilder*>(builder)->addText(utf8Ptr, static_cast<size_t>(byteLength));
}

void* ParagraphBuilder_build(void* builder, float wrapWidth) {
	if (!builder) return nullptr;
	auto* b = static_cast<skia::textlayout::ParagraphBuilder*>(builder);
	auto paragraph = b->Build();
	if (!paragraph) return nullptr;
	paragraph->layout(wrapWidth);
	return paragraph.release();
}

void DeleteParagraphBuilder(void* builder) {
	delete static_cast<skia::textlayout::ParagraphBuilder*>(builder);
}

void* MakeParagraphFromText(
	const char* utf8Ptr,
	int byteLength,
	void* fontBytesPtr,
	int fontByteLength,
	float fontSize,
	float wrapWidth,
	uint32_t color,
	int textAlign,
	int maxLines
) {
	if (!utf8Ptr || byteLength <= 0) return nullptr;
	auto builder = MakeParagraphBuilderInternal(fontBytesPtr, fontByteLength, fontSize, color, textAlign, maxLines, nullptr, 0);
	if (!builder) return nullptr;
	builder->addText(utf8Ptr, static_cast<size_t>(byteLength));
	auto paragraph = builder->Build();
	if (!paragraph) return nullptr;
	paragraph->layout(wrapWidth);
	return paragraph.release();
}

void* MakeParagraphFromTextWithEllipsis(
	const char* utf8Ptr,
	int byteLength,
	void* fontBytesPtr,
	int fontByteLength,
	float fontSize,
	float wrapWidth,
	uint32_t color,
	int textAlign,
	int maxLines,
	const char* ellipsisUtf8,
	int ellipsisByteLength
) {
	if (!utf8Ptr || byteLength <= 0) return nullptr;
	auto builder = MakeParagraphBuilderInternal(fontBytesPtr, fontByteLength, fontSize, color, textAlign, maxLines, ellipsisUtf8, ellipsisByteLength);
	if (!builder) return nullptr;
	builder->addText(utf8Ptr, static_cast<size_t>(byteLength));
	auto paragraph = builder->Build();
	if (!paragraph) return nullptr;
	paragraph->layout(wrapWidth);
	return paragraph.release();
}

void Paragraph_layout(void* paragraph, float width) {
	if (!paragraph) return;
	static_cast<skia::textlayout::Paragraph*>(paragraph)->layout(width);
}

float Paragraph_getHeight(void* paragraph) {
	if (!paragraph) return 0.0f;
	return static_cast<skia::textlayout::Paragraph*>(paragraph)->getHeight();
}

float Paragraph_getMaxWidth(void* paragraph) {
	if (!paragraph) return 0.0f;
	return static_cast<skia::textlayout::Paragraph*>(paragraph)->getMaxWidth();
}

float Paragraph_getMinIntrinsicWidth(void* paragraph) {
	if (!paragraph) return 0.0f;
	return static_cast<skia::textlayout::Paragraph*>(paragraph)->getMinIntrinsicWidth();
}

float Paragraph_getMaxIntrinsicWidth(void* paragraph) {
	if (!paragraph) return 0.0f;
	return static_cast<skia::textlayout::Paragraph*>(paragraph)->getMaxIntrinsicWidth();
}

float Paragraph_getLongestLine(void* paragraph) {
	if (!paragraph) return 0.0f;
	return static_cast<skia::textlayout::Paragraph*>(paragraph)->getLongestLine();
}

void DeleteParagraph(void* paragraph) {
	delete static_cast<skia::textlayout::Paragraph*>(paragraph);
}

// WebGPU stubs (cheap builds default to no WebGPU)
void* MakeGPUTextureSurface(uint32_t textureHandle, uint32_t textureFormat, int width, int height) {
	(void)textureHandle;
	(void)textureFormat;
	(void)width;
	(void)height;
	return nullptr;
}

int Surface_replaceBackendTexture(void* surface, uint32_t textureHandle, uint32_t textureFormat, int width, int height) {
	(void)surface;
	(void)textureHandle;
	(void)textureFormat;
	(void)width;
	(void)height;
	return 0;
}

void* MakeGrContext() {
	return nullptr;
}

}  // extern "C"
