"use client";

import { useState, useCallback } from "react";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ComboboxSelect } from "@/components/ui/combobox";

import type {
  ExpenseFormFieldErrors,
  ExpenseFormValues,
} from "@/lib/checking-account/types";
import {
  EXPENSE_CHECKING_CATEGORIES,
  EXPENSE_CATEGORIES_WITH_LABELS,
  MAX_DESCRIPTION_LENGTH,
  SUCCESS_FEEDBACK_MS,
} from "@/lib/checking-account/constants";
import {
  validateExpenseForm,
  validateAiSuggestionInput,
  mapBackendFieldErrors,
  toBackendDate,
} from "@/lib/checking-account/validation";
import {
  requestCategorySuggestion,
  createCheckingTransaction,
} from "@/lib/checking-account/api";

type PageStatus = "idle" | "submitting" | "ai-loading" | "success" | "error";

type ExpenseFormProps = {
  token: string;
  onSuccess?: () => void;
};

export function ExpenseForm({ token, onSuccess }: ExpenseFormProps) {
  const [status, setStatus] = useState<PageStatus>("idle");
  const [values, setValues] = useState<ExpenseFormValues>({
    date: "",
    amount: "",
    description: "",
    category: "",
  });
  const [fieldErrors, setFieldErrors] = useState<ExpenseFormFieldErrors>({});
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [touched, setTouched] = useState<Set<keyof ExpenseFormValues>>(new Set());

  const markFieldTouched = (field: keyof ExpenseFormValues) => {
    setTouched((prev) => new Set([...prev, field]));
  };

  const getFieldError = (field: keyof ExpenseFormValues): string | undefined => {
    if (fieldErrors[field]) {
      return fieldErrors[field];
    }
    // Show empty field error if field is touched and empty
    if (touched.has(field) && !values[field]) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
    return undefined;
  };

  const handleFieldChange = useCallback((key: keyof ExpenseFormValues, value: string) => {
    let sanitizedValue = value;
    // For amount field, allow only numbers and decimal point
    if (key === "amount") {
      sanitizedValue = value.replace(/[^\d.]/g, "");
      // Prevent multiple decimal points
      const parts = sanitizedValue.split(".");
      if (parts.length > 2) {
        sanitizedValue = parts[0] + "." + parts.slice(1).join("");
      }
    }
    setValues((prev) => ({ ...prev, [key]: sanitizedValue }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }, [fieldErrors]);

  const handleAiSuggest = useCallback(async () => {
    setStatus("ai-loading");
    setGlobalError("");
    const validationErrors = validateAiSuggestionInput(values);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setStatus("idle");
      return;
    }

    try {
      const amount = values.amount ? Number(values.amount) : undefined;
      const response = await requestCategorySuggestion(token, {
        description: values.description,
        amount,
        date: values.date ? toBackendDate(values.date) : undefined,
        transactionType: "EXPENSE",
      });

      if (response.status === 200) {
        const data = response.data as { content?: { suggestedCategory?: string } };
        if (data?.content?.suggestedCategory) {
          const suggested = data.content.suggestedCategory;
          setValues((prev) => ({ ...prev, category: suggested }));
        }
        setStatus("idle");
      } else if (response.status === 422) {
        setGlobalError("Failed to classify the category with AI. Please select manually.");
        setStatus("idle");
      } else if (response.status === 503) {
        setGlobalError("External AI service is currently unavailable. Please select manually.");
        setStatus("idle");
      } else if (response.status === 400) {
        const data = response.data as { fieldErrors?: Record<string, string> };
        const fieldErrs = data?.fieldErrors;
        setFieldErrors(mapBackendFieldErrors(fieldErrs));
        setStatus("idle");
      } else {
        setGlobalError("Failed to get category suggestion. Please try again.");
        setStatus("idle");
      }
    } catch {
      setGlobalError("Network error. Failed to get category suggestion.");
      setStatus("idle");
    }
  }, [values, token]);

  const handleSubmit = useCallback(async () => {
    setStatus("submitting");
    setFieldErrors({});
    setGlobalError("");

    const validationErrors = validateExpenseForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setStatus("idle");
      return;
    }

    try {
      const response = await createCheckingTransaction(token, {
        transactionType: "EXPENSE",
        transactionMethodType: "MANUAL",
        amount: Number(values.amount),
        date: toBackendDate(values.date),
        expenseCategory: values.category as typeof EXPENSE_CHECKING_CATEGORIES[number],
        description: values.description || undefined,
      });

      if (response.status === 200) {
        setSuccessMessage("Expense added successfully!");
        setStatus("success");
        setTimeout(() => {
          setStatus("idle");
          setValues({ date: "", amount: "", description: "", category: "" });
          setSuccessMessage("");
          onSuccess?.();
        }, SUCCESS_FEEDBACK_MS);
      } else if (response.status === 400) {
        const data = response.data as { fieldErrors?: Record<string, string>; message?: string };
        const fieldErrs = data?.fieldErrors;
        const globalMsg = data?.message;
        setFieldErrors(mapBackendFieldErrors(fieldErrs));
        if (globalMsg) {
          setGlobalError(globalMsg);
        }
        setStatus("idle");
      } else if (response.status === 401) {
        setGlobalError("Your session expired. Please log in again.");
        setStatus("idle");
      } else if (response.status === 500) {
        const data = response.data as { message?: string };
        setGlobalError(data?.message || "Internal server error. Please try again.");
        setStatus("idle");
      } else {
        setGlobalError("Unexpected error occurred. Please try again.");
        setStatus("idle");
      }
    } catch {
      setGlobalError("Network error. Failed to create transaction.");
      setStatus("idle");
    }
  }, [values, token, onSuccess]);

  const isFormValid = !!(values.date && values.amount && values.category && values.description);
  const isSubmitDisabled = status !== "idle" || !isFormValid;

  return (
    <div className="flex flex-col gap-4 py-0 max-h-[calc(100vh-200px)] overflow-y-auto ">
      <Tabs defaultValue="expense" className="w-full">
        <TabsList variant="line" className="w-full mb-4">
          <TabsTrigger value="expense">Expense Form</TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="gap-4 p-2">
          <FieldGroup className="gap-4">
            {successMessage && (
              <div className="rounded-md bg-green-100 border border-green-300 text-green-800 px-4 py-2 text-sm flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                <span>{successMessage}</span>
              </div>
            )}

            {globalError && (
              <div className="rounded-md bg-red-100 border border-red-300 text-red-800 px-4 py-2 text-sm">
                {globalError}
              </div>
            )}

            {/* Date and Amount side by side */}
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!getFieldError("date")}>
                <FieldLabel htmlFor="expense-date">Date</FieldLabel>
                <FieldContent>
                  <DatePicker
                    value={values.date}
                    onChange={(date) => handleFieldChange("date", date)}
                    onBlur={() => markFieldTouched("date")}
                    disabled={status !== "idle"}
                    placeholder="Pick a date"
                  />
                  {getFieldError("date") && <FieldError>{getFieldError("date")}</FieldError>}
                </FieldContent>
              </Field>

              <Field data-invalid={!!getFieldError("amount")}>
                <FieldLabel htmlFor="expense-amount">Amount</FieldLabel>
                <FieldContent>
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText>$</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id="expense-amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={values.amount}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^\d.]/g, "");
                        const parts = val.split(".");
                        if (parts.length > 2) {
                          val = parts[0] + "." + parts.slice(1).join("");
                        }
                        handleFieldChange("amount", val);
                      }}
                      onBlur={() => markFieldTouched("amount")}
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      disabled={status !== "idle"}
                      aria-invalid={!!getFieldError("amount")}
                    />
                  </InputGroup>
                  {getFieldError("amount") && <FieldError>{getFieldError("amount")}</FieldError>}
                </FieldContent>
              </Field>
            </div>

            {/* Category */}
            <Field data-invalid={!!getFieldError("category")}>
              <FieldLabel htmlFor="expense-category">Category</FieldLabel>
              <FieldContent className="gap-2">
                <div className="flex gap-2">
                  <ComboboxSelect
                    items={EXPENSE_CATEGORIES_WITH_LABELS}
                    value={values.category}
                    onValueChange={(val) => {
                      handleFieldChange("category", val);
                      markFieldTouched("category");
                    }}
                    placeholder="Select a category..."
                    searchPlaceholder="Search categories..."
                    disabled={status !== "idle"}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAiSuggest}
                    disabled={status !== "idle"}
                    title="Suggest category using AI"
                  >
                    {status === "ai-loading" ? (
                      <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                    ) : (
                      <Sparkles className="size-4" data-icon="inline-start" />
                    )}
                  </Button>
                </div>
                {getFieldError("category") && <FieldError>{getFieldError("category")}</FieldError>}
              </FieldContent>
            </Field>

            {/* Description */}
            <Field data-invalid={!!getFieldError("description")}>
              <FieldLabel htmlFor="expense-description">Description</FieldLabel>
              <FieldContent>
                <Input
                  id="expense-description"
                  type="text"
                  placeholder="What did you spend on?"
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  value={values.description}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  onBlur={() => markFieldTouched("description")}
                  disabled={status !== "idle"}
                  aria-invalid={!!getFieldError("description")}
                />
                <FieldDescription className="text-xs">
                  {values.description.length} / {MAX_DESCRIPTION_LENGTH}
                </FieldDescription>
                {getFieldError("description") && <FieldError>{getFieldError("description")}</FieldError>}
              </FieldContent>
            </Field>
          </FieldGroup>
        </TabsContent>
      </Tabs>

      {/* Add Expense button at bottom */}
      <div className="flex gap-3 pt-8 border-t mt-auto">
        <Button
          type="submit"
          size="lg"
          className="flex-1"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
              Adding...
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle2 className="size-4" data-icon="inline-start" />
              Success
            </>
          ) : (
            "Add Expense"
          )}
        </Button>
      </div>
    </div>
  );
}
