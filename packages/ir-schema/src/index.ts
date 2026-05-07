/**
 * @wewatch/ir-schema · main entry
 *
 * Re-exports everything callers should need to validate or type-check IRs.
 *
 * Spec: agents/garmin-sdk-agent/IR_SCHEMA.md (v0.1.0)
 */

export const IR_VERSION = '0.1.0' as const;

// Schemas (Zod)
export {
  WatchFaceIRSchema,
  MetaSchema,
  CanvasSchema,
  ColorSchemeSchema,
  TypographySchema,
  LayoutSchema,
  ElementSchema,
  TimeElementSchema,
  DateElementSchema,
  TextElementSchema,
  ImageElementSchema,
  ShapeElementSchema,
  ComplicationElementSchema,
  IndicatorElementSchema,
  ProgressArcElementSchema,
  BackgroundSchema,
  DataBindingSchema,
  PerformanceHintsSchema,
  EscapeHatchSchema,
  VisibilitySchema,
  AnchorSchema,
  SizeSchema,
  StyleSchema,
  HexColorSchema,
  ColorRefSchema,
  FontFamilySchema,
  ComplicationDataTypeSchema,
  ShapeKindSchema,
  IndicatorKindSchema,
} from './schema.js';

// Inferred types
export type {
  WatchFaceIR,
  Meta,
  Canvas,
  ColorScheme,
  Typography,
  Layout,
  Element,
  TimeElement,
  DateElement,
  TextElement,
  ImageElement,
  ShapeElement,
  ComplicationElement,
  IndicatorElement,
  ProgressArcElement,
  Background,
  DataBinding,
  PerformanceHints,
  EscapeHatch,
  Visibility,
  Anchor,
  Size,
  Style,
  HexColor,
  ColorRef,
  FontFamily,
  ComplicationDataType,
  ShapeKind,
  IndicatorKind,
  LocalizedString,
} from './types.js';
