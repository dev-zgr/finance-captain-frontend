"use client";

import { useState, useCallback } from "react";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
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
  CategorySuggestionRequest,
  ExtractedTransaction,
} from "@/lib/checking-account/types";
import {
  EXPENSE_CHECKING_CATEGORIES,
  EXPENSE_CATEGORIES_WITH_LABELS,
  MAX_DESCRIPTION_LENGTH,
} from "@/lib/checking-account/constants";
import {
  validateExpenseForm,
  mapBackendFieldErrors,
  toBackendDate,
} from "@/lib/checking-account/validation";
import {
  categorizeTransaction,
  createCheckingTransaction,
} from "@/lib/checking-account/api";
import { VlmUploadTab } from "./vlm-upload-tab";

type PageStatus = "idle" | "submitting" | "ai-loading" | "success" | "error";

type ExpenseFormProps = {
  token: string;
  onSuccess?: () => void;
};

export function ExpenseForm({ token, onSuccess }: ExpenseFormProps) {
  const [status, setStatus] = useState<PageStatus>("idle");
  const [showFadeOut, setShowFadeOut] = useState(false);
  const [activeTab, setActiveTab] = useState("expense");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [values, setValues] = useState<ExpenseFormValues>({
    date: "",
    amount: "",
    description: "",
    category: "",
  });
  const [fieldErrors, setFieldErrors] = useState<ExpenseFormFieldErrors>({});
  const [globalError, setGlobalError] = useState("");
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
    setAiLoading(true);
    setGlobalError("");

    // Only description is required for categorize API
    if (!values.description.trim()) {
      setGlobalError("Please enter a description to get category suggestions.");
      setAiLoading(false);
      return;
    }

    try {
      const amount = values.amount ? Number(values.amount) : undefined;
      const payload: CategorySuggestionRequest = {
        description: values.description,
        amount,
        date: values.date ? toBackendDate(values.date) : undefined,
        transactionType: "EXPENSE",
      };
      console.log("🤖 AI Categorize Request:", payload);
      const response = await categorizeTransaction(token, payload);
      console.log("🤖 AI Categorize Response:", response.status, response.data);

      if (response.status === 200) {
        const data = response.data as { content?: { category?: string } };
        console.log("🤖 Suggested Category Data:", data);
        if (data?.content?.category) {
          const suggested = data.content.category;
          console.log("🤖 Setting category to:", suggested);
          setValues((prev) => ({ ...prev, category: suggested }));
          setAiMessage({
            type: "success",
            message: `Category auto-selected: ${suggested}`,
          });
          // Auto-clear success message after 3.5 seconds
          setTimeout(() => {
            setAiMessage(null);
          }, 3500);
        } else {
          console.log("🤖 No category found in response");
          setAiMessage({
            type: "error",
            message: "Failed to determine category. Please select manually.",
          });
        }
        setAiLoading(false);
      } else if (response.status === 422) {
        setAiMessage({
          type: "error",
          message: "Failed to classify the category with AI. Please select manually.",
        });
        setAiLoading(false);
      } else if (response.status === 503) {
        setAiMessage({
          type: "error",
          message: "External AI service is currently unavailable. Please select manually.",
        });
        setAiLoading(false);
      } else if (response.status === 400) {
        const data = response.data as { fieldErrors?: Record<string, string> };
        const fieldErrs = data?.fieldErrors;
        setFieldErrors(mapBackendFieldErrors(fieldErrs));
        setAiMessage({
          type: "error",
          message: "Invalid input for AI categorization. Please check your entries.",
        });
        setAiLoading(false);
      } else if (response.status === 401) {
        setAiMessage({
          type: "error",
          message: "Your session expired. Please log in again.",
        });
        setAiLoading(false);
      } else {
        setAiMessage({
          type: "error",
          message: "Failed to get category suggestion. Please try again.",
        });
        setAiLoading(false);
      }
    } catch {
      setAiMessage({
        type: "error",
        message: "Network error. Failed to get category suggestion.",
      });
      setAiLoading(false);
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
        setStatus("success");
        // Trigger fade out after 2.5 seconds
        setTimeout(() => {
          setShowFadeOut(true);
          // Then reset after fade animation completes (300ms)
          setTimeout(() => {
            setStatus("idle");
            setShowFadeOut(false);
            setValues({ date: "", amount: "", description: "", category: "" });
            setTouched(new Set());
            setAiMessage(null);
            onSuccess?.();
          }, 300);
        }, 2500);
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

  const handleVlmConfirm = useCallback(async (extracted: ExtractedTransaction) => {
    setStatus("submitting");
    setFieldErrors({});
    setGlobalError("");

    try {
      const response = await createCheckingTransaction(token, {
        transactionType: "EXPENSE",
        transactionMethodType: "VLM_EXTRACTION",
        amount: extracted.amount,
        date: extracted.date,
        expenseCategory: extracted.expenseCategory as typeof EXPENSE_CHECKING_CATEGORIES[number],
        description: extracted.description || undefined,
      });

      if (response.status === 200) {
        setStatus("success");
        setTimeout(() => {
          setShowFadeOut(true);
          setTimeout(() => {
            setStatus("idle");
            setShowFadeOut(false);
            setValues({ date: "", amount: "", description: "", category: "" });
            setTouched(new Set());
            setActiveTab("expense");
            onSuccess?.();
          }, 300);
        }, 2500);
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
  }, [token, onSuccess]);

  const handleVlmEdit = useCallback((extracted: ExtractedTransaction) => {
    setValues({
      date: extracted.date,
      amount: String(extracted.amount),
      category: extracted.expenseCategory || "",
      description: extracted.description,
    });
    setTouched(new Set());
    setActiveTab("expense");
  }, []);

  const isFormValid = !!(values.date && values.amount && values.category && values.description);
  const isSubmitDisabled = status !== "idle" || !isFormValid;

  return (
    <div className="flex flex-col gap-4 py-0 max-h-[calc(100vh-200px)] overflow-y-auto relative">
      {/* Success Overlay - Spinner then Checkmark */}
      {(status === "submitting" || status === "success") && (
        <div className={`absolute inset-0 bg-white rounded-lg flex items-center justify-center z-50 transition-opacity duration-300 ${showFadeOut ? "opacity-0" : "opacity-100"}`}>
          {status === "submitting" && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-12 animate-spin text-gray-700" />
              <p className="text-gray-700 text-sm font-medium">Processing...</p>
            </div>
          )}
          {status === "success" && (
            <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
              <div className="rounded-full bg-gray-200/50 p-4">
                <CheckCircle2 className="size-12 text-gray-800" strokeWidth={1.5} />
              </div>
              <p className="text-gray-700 text-sm font-medium">Expense Added!</p>
            </div>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className={`w-full transition-opacity duration-300 ${(status === "submitting" || status === "success") && !showFadeOut ? "opacity-0" : "opacity-100"}`}>
        <TabsList variant="line" className="w-full mb-4">
          <TabsTrigger value="expense">Expense Form</TabsTrigger>
          <TabsTrigger value="scan">Scan Receipt</TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="gap-4 p-2">
          <FieldGroup className="gap-4">
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
                <div className="flex gap-2 w-full">
                  <div className="flex-1 min-w-0">
                    <ComboboxSelect
                      items={EXPENSE_CATEGORIES_WITH_LABELS}
                      value={values.category}
                      onValueChange={(val) => {
                        handleFieldChange("category", val);
                        markFieldTouched("category");
                        setAiMessage(null); // Clear AI message when manually changed
                      }}
                      onBlur={() => markFieldTouched("category")}
                      placeholder="Select a category..."
                      searchPlaceholder="Search categories..."
                      disabled={status !== "idle"}
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    onClick={handleAiSuggest}
                    disabled={aiLoading || !values.description.trim()}
                    title={values.description.trim() ? "Suggest category using AI" : "Enter description first"}
                    className="flex-shrink-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? (
                      <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                    ) : (
                      <Sparkles className="size-4" data-icon="inline-start" />
                    )}
                  </Button>
                </div>
                {aiMessage && (
                  <div
                    className={`text-sm mt-1 ${
                      aiMessage.type === "success"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {aiMessage.message}
                  </div>
                )}
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
                <div className={"mt-1"}>

                  <FieldDescription className="text-xs">
                    {values.description.length} / {MAX_DESCRIPTION_LENGTH}
                  </FieldDescription>
                </div>
                {getFieldError("description") && <FieldError>{getFieldError("description")}</FieldError>}
              </FieldContent>
            </Field>
          </FieldGroup>
        </TabsContent>

        <TabsContent value="scan" className="gap-4 p-2">
          <VlmUploadTab
            transactionType="EXPENSE"
            token={token}
            onConfirm={handleVlmConfirm}
            onEdit={handleVlmEdit}
          />
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
