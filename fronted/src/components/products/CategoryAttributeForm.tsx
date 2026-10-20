import { useEffect, useMemo, useState } from "react";
import {
  getProductCategories,
  type ProductCategory,
  type ProductCategoryAttribute,
} from "../../Services/api/categories";

type FormValue = string | number | boolean | null;

const normalizeDataType = (value: string): string => value.trim().toLowerCase();

const getAttributeKind = (attribute: ProductCategoryAttribute): "number" | "boolean" | "select" | "text" => {
  const dataType = normalizeDataType(attribute.dataType);

  if (
    ["number", "float", "decimal", "double", "integer", "int"].some((type) =>
      dataType.includes(type),
    )
  ) {
    return "number";
  }

  if (["bool", "boolean"].some((type) => dataType.includes(type))) {
    return "boolean";
  }

  if (["enum", "select", "choice", "option"].some((type) => dataType.includes(type))) {
    return "select";
  }

  return "text";
};

const getFallbackSelectOptions = (attribute: ProductCategoryAttribute) => {
  const label = attribute.name.toLowerCase();

  if (label.includes("color") || label.includes("tono") || label.includes("material")) {
    return ["Blanco", "Negro", "Gris", "Azul", "Rojo"];
  }

  if (label.includes("marca") || label.includes("fabricante")) {
    return ["Samsung", "Apple", "LG", "Sony", "Xiaomi"];
  }

  return ["Opción 1", "Opción 2", "Opción 3"];
};

const validateAttributeValue = (
  attribute: ProductCategoryAttribute,
  value: FormValue,
): string | null => {
  const kind = getAttributeKind(attribute);

  if (value === null || value === "") {
    return attribute.required ? "Este campo es obligatorio." : null;
  }

  if (kind === "number") {
    const asNumber = Number(value);
    if (!Number.isFinite(asNumber)) {
      return "Debe ingresar un número válido.";
    }
  }

  if (kind === "boolean" && typeof value !== "boolean") {
    return "Debe seleccionar una opción válida.";
  }

  if (kind === "text" && typeof value === "string" && value.trim().length === 0) {
    return attribute.required ? "Este campo es obligatorio." : null;
  }

  return null;
};

export function CategoryAttributeForm() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [values, setValues] = useState<Record<number, FormValue>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getProductCategories()
      .then((result) => {
        if (!isMounted) return;
        setCategories(result);
        setSelectedCategoryId(result[0]?.id ?? null);
      })
      .catch((caughtError: unknown) => {
        if (!isMounted) return;
        setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las categorías.");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  useEffect(() => {
    if (!selectedCategory) return;

    setValues((currentValues) => {
      const nextValues: Record<number, FormValue> = { ...currentValues };

      for (const attribute of selectedCategory.attributes) {
        if (!(attribute.id in nextValues)) {
          nextValues[attribute.id] = attribute.required ? "" : null;
        }
      }

      for (const attributeId of Object.keys(nextValues).map(Number)) {
        const exists = selectedCategory.attributes.some((attribute) => attribute.id === attributeId);
        if (!exists) {
          delete nextValues[attributeId];
        }
      }

      return nextValues;
    });
  }, [selectedCategory]);

  const handleValueChange = (attribute: ProductCategoryAttribute, rawValue: string) => {
    const kind = getAttributeKind(attribute);
    const nextValue: FormValue =
      kind === "number"
        ? rawValue === ""
          ? null
          : Number(rawValue)
        : kind === "boolean"
          ? rawValue === ""
            ? null
            : rawValue === "true"
          : rawValue;

    setValues((currentValues) => ({
      ...currentValues,
      [attribute.id]: nextValue,
    }));

    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      const validationError = validateAttributeValue(attribute, nextValue);

      if (validationError) {
        nextErrors[attribute.id] = validationError;
      } else {
        delete nextErrors[attribute.id];
      }

      return nextErrors;
    });

    setSubmitMessage(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCategory) return;

    const nextErrors: Record<number, string> = {};
    const payload = selectedCategory.attributes.reduce<Record<string, FormValue>>((result, attribute) => {
      const entry = values[attribute.id];
      const validationError = validateAttributeValue(attribute, entry ?? null);

      if (validationError) {
        nextErrors[attribute.id] = validationError;
      }

      const normalizedValue =
        entry === "" || entry === null || entry === undefined ? null : entry;

      result[attribute.name] = normalizedValue;
      return result;
    }, {});

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitMessage("Corrige los campos obligatorios antes de guardar.");
      return;
    }

    setSubmitMessage(`Formulario válido para ${selectedCategory.name}.`);
    console.info("Category form payload", payload);
  };

  if (loading) {
    return (
      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-950/35 p-5">
        <p className="text-sm text-slate-300">Cargando formulario de categoría...</p>
      </section>
    );
  }

  if (error || !selectedCategory) {
    return (
      <section className="mt-8 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5">
        <p className="text-sm text-rose-100">{error ?? "No hay categorías disponibles."}</p>
      </section>
    );
  }

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <div className="border-b border-white/10 bg-gradient-to-r from-slate-900/90 to-slate-900/60 px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-prime">Formulario dinámico</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-white">Atributos de la categoría</h2>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <span>Categoría</span>
            <select
              value={selectedCategory.id}
              onChange={(event) => setSelectedCategoryId(Number(event.target.value))}
              className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 transition focus:border-prime"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        {submitMessage && (
          <div
            className={`rounded-xl border px-3 py-2 text-sm ${
              submitMessage.includes("Corrige")
                ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
            }`}
          >
            {submitMessage}
          </div>
        )}

        <div className="space-y-4">
          {selectedCategory.attributes
            .slice()
            .sort((first, second) => first.displayOrder - second.displayOrder)
            .map((attribute) => {
              const attributeKind = getAttributeKind(attribute);
              const rawValue = values[attribute.id] ?? (attribute.required ? "" : "");
              const isBoolean = attributeKind === "boolean";
              const hasUnit = attribute.unit && attribute.unit.trim().length > 0;
              const fieldError = errors[attribute.id];
              const inputClassName = `w-full rounded-lg border bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-prime ${
                fieldError ? "border-rose-400/60" : "border-white/10"
              }`;

              return (
                <label
                  key={attribute.id}
                  className="block rounded-xl border border-white/10 bg-slate-900/55 p-4"
                >
                  <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-200">
                    <span>{attribute.name}</span>
                    {attribute.required && (
                      <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200">
                        Requerido
                      </span>
                    )}
                  </span>

                  {attributeKind === "boolean" ? (
                    <select
                      value={String(rawValue === null ? "" : rawValue)}
                      onChange={(event) => handleValueChange(attribute, event.target.value)}
                      className={inputClassName}
                    >
                      <option value="">Seleccionar</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  ) : attributeKind === "select" ? (
                    <select
                      value={String(rawValue === null ? "" : rawValue)}
                      onChange={(event) => handleValueChange(attribute, event.target.value)}
                      className={inputClassName}
                    >
                      <option value="">Seleccionar</option>
                      {getFallbackSelectOptions(attribute).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : attributeKind === "number" ? (
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={rawValue === null || rawValue === "" ? "" : String(rawValue)}
                        onChange={(event) => handleValueChange(attribute, event.target.value)}
                        className={`${inputClassName} pr-12`}
                        placeholder={hasUnit ? `Valor en ${attribute.unit}` : "Ingrese un valor"}
                      />
                      {hasUnit && (
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                          {attribute.unit}
                        </span>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={rawValue === null ? "" : String(rawValue)}
                      onChange={(event) => handleValueChange(attribute, event.target.value)}
                      className={inputClassName}
                      placeholder={isBoolean ? "Ingrese un valor" : "Ingrese texto"}
                    />
                  )}

                  {fieldError && (
                    <span className="mt-2 block text-xs text-rose-200">{fieldError}</span>
                  )}

                  {attribute.comparable && (
                    <span className="mt-2 block text-[11px] uppercase tracking-[0.12em] text-cyan-200">
                      Comparables
                    </span>
                  )}
                </label>
              );
            })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <p className="text-xs text-slate-400">
            {selectedCategory.attributes.length} atributo{selectedCategory.attributes.length === 1 ? "" : "s"}
          </p>
          <button
            type="submit"
            className="rounded-lg bg-prime px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Guardar formulario
          </button>
        </div>
      </form>
    </section>
  );
}
