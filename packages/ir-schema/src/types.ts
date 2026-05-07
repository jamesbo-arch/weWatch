/**
 * Type aliases inferred from Zod schemas.
 * Single source of truth — never edit hand-written types here for IR shape.
 */

import { z } from 'zod';
import {
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
  LocalizedStringSchema,
} from './schema.js';

export type WatchFaceIR = z.infer<typeof WatchFaceIRSchema>;
export type Meta = z.infer<typeof MetaSchema>;
export type Canvas = z.infer<typeof CanvasSchema>;
export type ColorScheme = z.infer<typeof ColorSchemeSchema>;
export type Typography = z.infer<typeof TypographySchema>;
export type Layout = z.infer<typeof LayoutSchema>;
export type Element = z.infer<typeof ElementSchema>;
export type TimeElement = z.infer<typeof TimeElementSchema>;
export type DateElement = z.infer<typeof DateElementSchema>;
export type TextElement = z.infer<typeof TextElementSchema>;
export type ImageElement = z.infer<typeof ImageElementSchema>;
export type ShapeElement = z.infer<typeof ShapeElementSchema>;
export type ComplicationElement = z.infer<typeof ComplicationElementSchema>;
export type IndicatorElement = z.infer<typeof IndicatorElementSchema>;
export type ProgressArcElement = z.infer<typeof ProgressArcElementSchema>;
export type Background = z.infer<typeof BackgroundSchema>;
export type DataBinding = z.infer<typeof DataBindingSchema>;
export type PerformanceHints = z.infer<typeof PerformanceHintsSchema>;
export type EscapeHatch = z.infer<typeof EscapeHatchSchema>;
export type Visibility = z.infer<typeof VisibilitySchema>;
export type Anchor = z.infer<typeof AnchorSchema>;
export type Size = z.infer<typeof SizeSchema>;
export type Style = z.infer<typeof StyleSchema>;
export type HexColor = z.infer<typeof HexColorSchema>;
export type ColorRef = z.infer<typeof ColorRefSchema>;
export type FontFamily = z.infer<typeof FontFamilySchema>;
export type ComplicationDataType = z.infer<typeof ComplicationDataTypeSchema>;
export type ShapeKind = z.infer<typeof ShapeKindSchema>;
export type IndicatorKind = z.infer<typeof IndicatorKindSchema>;
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;
