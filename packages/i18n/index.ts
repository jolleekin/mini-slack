type Join<A extends string, B> = B extends string ? `${A}.${B}` : A;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export type TranslationKey<T, Depth extends number = 9> = Depth extends never
  ? never
  : T extends string
    ? 0 // Sentinel value to indicate leaf node
    : T extends Record<infer K, infer _>
      ? {
          [P in keyof T]: P extends string
            ? Join<P, TranslationKey<T[P], Prev[Depth]>>
            : never;
        }[K]
      : never;

export type TranslationParams = Record<string, unknown>;

const PLACEHOLDER = /{{(\w+)}}/g;

export function createTranslator<Translations extends Record<string, any>>(
  translations: Translations,
) {
  return function t(
    key: TranslationKey<Translations>,
    params?: TranslationParams,
  ) {
    const keys = key.split(".");
    let result: any = translations;

    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) break;
    }

    if (typeof result !== "string") return key;

    // Replace placeholders: {{param}}.
    if (params) {
      return result.replaceAll(PLACEHOLDER, (_, p) => {
        const value = params[p];
        if (value == null) console.warn(`Missing value for param {{${p}}}. Key = ${key}.`);
        return String(value);
      });
    }

    return result;
  };
}
