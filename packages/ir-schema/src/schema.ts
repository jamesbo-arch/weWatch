/**
 * Watch Face IR · Zod schemas
 *
 * IMPORTANT:
 *  - Spec: agents/garmin-sdk-agent/IR_SCHEMA.md
 *  - Any change here MUST update the spec doc and bump version
 *  - Zod is the source of truth; .d.ts is derived
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────
//  Atoms
// ─────────────────────────────────────────────────────────

/** A 6-digit hex color string, e.g. "#FF6600" or with alpha "#FF660080" */
export const HexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/, 'Must be #RRGGBB or #RRGGBBAA');

/** Reference to a color either in the scheme or a literal hex */
export const ColorRefSchema = z.union([
  z.enum(['primary', 'secondary', 'accent', 'danger', 'background']),
  HexColorSchema,
]);

export const FontFamilySchema = z.enum([
  'system-tiny',
  'system-small',
  'system-medium',
  'system-large',
  'system-xtiny',
  'system-numeric-large',
  'system-numeric-mild',
]);

export const LocalizedStringSchema = z.object({
  default: z.string().min(1),
}).catchall(z.string());

const IsoDateTimeSchema = z.string().datetime({ offset: true });

// ─────────────────────────────────────────────────────────
//  Meta
// ─────────────────────────────────────────────────────────

export const MetaSchema = z.object({
  id: z.string().min(1),
  designer_id: z.string().min(1),
  name: LocalizedStringSchema,
  description: LocalizedStringSchema.optional(),
  tags: z.array(z.string()).max(20).default([]),
  created_at: IsoDateTimeSchema.optional(),
  license: z
    .enum(['platform-default', 'cc-by', 'custom'])
    .default('platform-default'),
  ai_generated: z.boolean().default(false),
  ip_review_status: z
    .enum(['pending', 'approved', 'rejected'])
    .default('pending'),
});

// ─────────────────────────────────────────────────────────
//  Canvas / Background
// ─────────────────────────────────────────────────────────

const SolidBgSchema = z.object({
  type: z.literal('solid'),
  solid: z.object({ color: HexColorSchema }),
});

const GradientStopSchema = z.object({
  offset: z.number().min(0).max(1),
  color: HexColorSchema,
});

const GradientBgSchema = z.object({
  type: z.literal('gradient'),
  gradient: z
    .object({
      kind: z.enum(['linear', 'radial']),
      stops: z.array(GradientStopSchema).min(2).max(8),
      angle_deg: z.number().min(0).max(360).optional(),
    })
    .superRefine((g, ctx) => {
      if (g.kind === 'linear' && g.angle_deg === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'angle_deg is required for linear gradient',
          path: ['angle_deg'],
        });
      }
    }),
});

const ImageBgSchema = z.object({
  type: z.literal('image'),
  image: z.object({
    asset_id: z.string().min(1),
    fit: z.enum(['cover', 'contain', 'tile']).default('cover'),
    tint: z.union([HexColorSchema, z.null()]).default(null),
  }),
});

// Explicit recursive type required to avoid z.ZodType<unknown>
export type BackgroundType =
  | z.infer<typeof SolidBgSchema>
  | z.infer<typeof GradientBgSchema>
  | z.infer<typeof ImageBgSchema>
  | { type: 'layered'; layered: { layers: BackgroundType[] } };

// Input/output types diverge due to .default() fields, so cast is required here
export const BackgroundSchema: z.ZodType<BackgroundType, z.ZodTypeDef, unknown> = z.union([
  SolidBgSchema,
  GradientBgSchema,
  ImageBgSchema,
  z.object({
    type: z.literal('layered'),
    layered: z.object({
      layers: z.lazy(() => z.array(BackgroundSchema).min(1).max(4)),
    }),
  }),
]) as unknown as z.ZodType<BackgroundType, z.ZodTypeDef, unknown>;

export const CanvasSchema = z.object({
  shape: z.enum(['round', 'square', 'rectangle']),
  reference_resolution: z.tuple([
    z.number().int().min(64).max(800),
    z.number().int().min(64).max(800),
  ]),
  background: BackgroundSchema,
});

// ─────────────────────────────────────────────────────────
//  Color Scheme / Typography
// ─────────────────────────────────────────────────────────

export const ColorSchemeSchema = z.object({
  primary: HexColorSchema,
  secondary: HexColorSchema,
  accent: HexColorSchema,
  danger: HexColorSchema,
  background: HexColorSchema,
  supports_aod: z.boolean().default(false),
  aod_overrides: z
    .object({
      primary: HexColorSchema.optional(),
      secondary: HexColorSchema.optional(),
      accent: HexColorSchema.optional(),
      danger: HexColorSchema.optional(),
      background: HexColorSchema.optional(),
    })
    .optional(),
});

export const TypographySchema = z.object({
  fonts: z
    .array(
      z.object({
        id: z.string().min(1),
        family: FontFamilySchema,
        fallback: FontFamilySchema.optional(),
      }),
    )
    .min(1)
    .max(8),
});

// ─────────────────────────────────────────────────────────
//  Element common parts
// ─────────────────────────────────────────────────────────

export const AnchorSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  align_x: z.enum(['center', 'left', 'right']).default('center'),
  align_y: z.enum(['middle', 'top', 'bottom']).default('middle'),
});

export const SizeSchema = z.union([
  z.object({ mode: z.literal('auto') }),
  z.object({
    mode: z.literal('fixed'),
    width: z.number().min(0).max(1),
    height: z.number().min(0).max(1),
  }),
]);

export const StyleSchema = z.object({
  color_ref: ColorRefSchema.optional(),
  font_ref: z.string().optional(),
  opacity: z.number().min(0).max(1).default(1),
  shadow: z
    .object({
      offset_x: z.number(),
      offset_y: z.number(),
      blur: z.number().min(0),
      color: HexColorSchema,
    })
    .nullable()
    .default(null),
});

const VisibilityConditionSchema = z.object({
  when: z.enum([
    'battery_level',
    'is_charging',
    'time_hour',
    'is_aod',
    'has_notification',
    'is_dnd',
    'is_bluetooth_connected',
  ]),
  op: z.enum(['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'between']),
  value: z.union([
    z.number(),
    z.boolean(),
    z.string(),
    z.tuple([z.number(), z.number()]),
  ]),
});

export const VisibilitySchema = z.object({
  always: z.boolean().default(true),
  aod_visible: z.boolean().default(false),
  conditions: z.array(VisibilityConditionSchema).default([]),
});

const ElementBaseShape = {
  id: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9_]*$/, 'id must be snake_case starting with letter'),
  anchor: AnchorSchema,
  size: SizeSchema,
  style: StyleSchema,
  visibility: VisibilitySchema,
  fallback_strategy: z
    .enum(['drop_device', 'hide_element', 'render_placeholder'])
    .default('drop_device'),
} as const;

// ─────────────────────────────────────────────────────────
//  Element variants (discriminated union by `type`)
// ─────────────────────────────────────────────────────────

export const TimeElementSchema = z.object({
  ...ElementBaseShape,
  type: z.literal('time'),
  props: z.object({
    format: z.enum(['HH:mm', 'hh:mm', 'HH:mm:ss', 'h:mm']),
    show_leading_zero: z.boolean().default(true),
  }),
});

export const DateElementSchema = z.object({
  ...ElementBaseShape,
  type: z.literal('date'),
  props: z.object({
    format: z.enum([
      'YYYY-MM-DD',
      'MMM dd',
      'ddd, MMM dd',
      'yyyy年MM月dd日',
      'dd/MM',
      'MM/dd',
    ]),
    locale: z
      .enum(['auto', 'zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'th-TH'])
      .default('auto'),
  }),
});

export const TextElementSchema = z.object({
  ...ElementBaseShape,
  type: z.literal('text'),
  props: z.object({
    /**
     * Static text or a `{{binding_id}}` reference.
     * Bindings are resolved against the IR's `data_bindings` array at render time.
     */
    content: z.string().min(1).max(120),
    max_chars: z.number().int().min(1).max(120).optional(),
  }),
});

export const ImageElementSchema = z.object({
  ...ElementBaseShape,
  type: z.literal('image'),
  props: z.object({
    asset_id: z.string().min(1),
  }),
});

export const ShapeKindSchema = z.enum(['rectangle', 'circle', 'line', 'arc']);

// Base object needed for z.discriminatedUnion (which requires ZodObject, not ZodEffects)
const ShapeElementSchemaBase = z.object({
  ...ElementBaseShape,
  type: z.literal('shape'),
  props: z.object({
    kind: ShapeKindSchema,
    stroke_width: z.number().min(0).max(20).default(1),
    fill: z.boolean().default(false),
    // arc-only
    start_angle: z.number().optional(),
    end_angle: z.number().optional(),
  }),
});

export const ShapeElementSchema = ShapeElementSchemaBase.superRefine((el, ctx) => {
  if (el.props.kind === 'arc') {
    if (el.props.start_angle === undefined || el.props.end_angle === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'arc requires start_angle and end_angle',
        path: ['props'],
      });
    }
  }
});

export const ComplicationDataTypeSchema = z.enum([
  'heart_rate',
  'steps',
  'battery',
  'calories',
  'distance',
  'weather_temp',
  'weather_condition',
  'moonphase',
  'next_calendar',
  'stress',
  'body_battery',
  'active_minutes',
]);

export const ComplicationElementSchema = z.object({
  ...ElementBaseShape,
  type: z.literal('complication'),
  props: z.object({
    data_type: ComplicationDataTypeSchema,
    display_style: z.enum(['value', 'icon_value', 'ring_value', 'bar_value']),
    label: z.string().max(8).nullable().default(null),
    unit_system: z.enum(['metric', 'imperial', 'auto']).default('auto'),
  }),
});

export const IndicatorKindSchema = z.enum([
  'bluetooth',
  'do_not_disturb',
  'alarm',
  'phone_battery_low',
  'notifications',
]);

export const IndicatorElementSchema = z.object({
  ...ElementBaseShape,
  type: z.literal('indicator'),
  props: z.object({
    kind: IndicatorKindSchema,
    icon_set: z.enum(['default', 'minimal']).default('default'),
  }),
});

export const ProgressArcElementSchema = z.object({
  ...ElementBaseShape,
  type: z.literal('progress_arc'),
  props: z.object({
    data_type: z.enum([
      'steps_progress',
      'calories_progress',
      'active_minutes_progress',
      'battery_progress',
    ]),
    start_angle: z.number(),
    sweep_angle: z.number().min(0).max(360),
    thickness: z.number().min(1).max(20),
    background_color_ref: ColorRefSchema,
    fill_color_ref: ColorRefSchema,
  }),
});

export const ElementSchema = z.discriminatedUnion('type', [
  TimeElementSchema,
  DateElementSchema,
  TextElementSchema,
  ImageElementSchema,
  ShapeElementSchemaBase,
  ComplicationElementSchema,
  IndicatorElementSchema,
  ProgressArcElementSchema,
]);

// ─────────────────────────────────────────────────────────
//  Layout / Bindings / Hints / EscapeHatch
// ─────────────────────────────────────────────────────────

export const LayoutSchema = z.object({
  engine: z.enum(['anchor']).default('anchor'),
  elements: z.array(ElementSchema).min(1).max(40),
});

export const DataBindingSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  ttl_sec: z.number().int().min(1).max(86400),
});

export const PerformanceHintsSchema = z.object({
  redraw_budget: z.enum(['low', 'medium', 'high']).default('low'),
  aod_strategy: z
    .enum(['static', 'minimal_seconds', 'full'])
    .default('static'),
});

export const EscapeHatchSchema = z.object({
  monkey_c_snippets: z
    .array(
      z.object({
        id: z.string().min(1),
        phase: z.enum(['before_draw', 'after_draw', 'on_partial_update']),
        code: z.string().max(8000),
      }),
    )
    .max(10)
    .default([]),
});

// ─────────────────────────────────────────────────────────
//  Top-level IR
// ─────────────────────────────────────────────────────────

export const WatchFaceIRSchema = z
  .object({
    ir_version: z
      .string()
      .regex(/^0\.1\.\d+$/, 'This validator only accepts IR v0.1.x'),
    meta: MetaSchema,
    canvas: CanvasSchema,
    color_scheme: ColorSchemeSchema,
    typography: TypographySchema,
    layout: LayoutSchema,
    data_bindings: z.array(DataBindingSchema).default([]),
    interactions: z.array(z.unknown()).max(10).default([]),
    performance_hints: PerformanceHintsSchema.default({
      redraw_budget: 'low',
      aod_strategy: 'static',
    }),
    escape_hatch: EscapeHatchSchema.optional(),
  })
  .superRefine((ir, ctx) => {
    // 1. element ids must be unique
    const ids = ir.layout.elements.map((e) => e.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate element ids: ${[...new Set(dupes)].join(', ')}`,
        path: ['layout', 'elements'],
      });
    }

    // 2. font_ref / color_ref resolution sanity (lightweight; deeper check in validators.ts)
    const knownFontIds = new Set(ir.typography.fonts.map((f) => f.id));
    ir.layout.elements.forEach((el, i) => {
      const ref = el.style?.font_ref;
      if (ref && !knownFontIds.has(ref)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Element[${i}] (id=${el.id}) references unknown font_ref="${ref}"`,
          path: ['layout', 'elements', i, 'style', 'font_ref'],
        });
      }
    });

    // 3. data_binding ids unique
    const bindingIds = ir.data_bindings.map((b) => b.id);
    const bindingDupes = bindingIds.filter(
      (id, i) => bindingIds.indexOf(id) !== i,
    );
    if (bindingDupes.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate data_binding ids: ${[...new Set(bindingDupes)].join(', ')}`,
        path: ['data_bindings'],
      });
    }

    // 4. ip_review_status gate: production builds need 'approved'
    //    (we don't enforce here — validators.ts has a stricter business validator
    //     that the build pipeline calls before compiling)

    // 5. AOD coherence: if any element aod_visible=true, color_scheme must support_aod
    const wantsAod = ir.layout.elements.some((el) => el.visibility.aod_visible);
    if (wantsAod && !ir.color_scheme.supports_aod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Some elements have aod_visible=true but color_scheme.supports_aod=false. Either disable aod_visible or set supports_aod=true.',
        path: ['color_scheme', 'supports_aod'],
      });
    }
  });
