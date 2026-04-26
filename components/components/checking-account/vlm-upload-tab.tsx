"use client";

import { useState, useCallback, useRef } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type {
  ExtractedTransaction,
  TransactionType,
  VlmExtractionResponse,
} from "@/lib/checking-account/types";
import {
  CATEGORY_DISPLAY_MAP,
  INCOME_CATEGORY_DISPLAY_MAP,
} from "@/lib/checking-account/constants";
import { extractTransactionFromImage } from "@/lib/checking-account/api";

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

type VlmUploadTabStatus = "idle" | "uploading" | "processing" | "success" | "error";

type VlmUploadTabProps = {
  transactionType: TransactionType;
  token: string;
  onConfirm: (extracted: ExtractedTransaction) => void;
  onEdit: (extracted: ExtractedTransaction) => void;
};

export function VlmUploadTab({
  transactionType,
  token,
  onConfirm,
  onEdit,
}: VlmUploadTabProps) {
  const [status, setStatus] = useState<VlmUploadTabStatus>("idle");
  const [fileError, setFileError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractedTransaction | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!file) return "Please select a file";
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      return "Invalid file type. Supported: JPEG, PNG, PDF";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 5 MB limit";
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
    } else {
      setFileError("");
      setSelectedFile(file);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleExtractData = useCallback(async () => {
    if (!selectedFile) {
      setFileError("Please select a file");
      return;
    }

    setStatus("uploading");
    setGlobalError("");
    setFileError("");

    try {
      const response = await extractTransactionFromImage(
        token,
        selectedFile,
        transactionType
      );

      if (response.status === 200) {
        const data = response.data as { content?: VlmExtractionResponse };
        const extractedData = data?.content;

        if (extractedData) {
          setStatus("success");
          
          const categoryField = transactionType === "EXPENSE" 
            ? "expenseCategory" 
            : "incomeCategory";

          const transaction: ExtractedTransaction = {
            date: extractedData.date || "",
            amount: extractedData.amount || 0,
            [categoryField]: extractedData[categoryField as never] || "",
            description: extractedData.description || "",
          };

          setExtracted(transaction);
          setStatus("idle");
        } else {
          setGlobalError("Failed to extract data from image");
          setStatus("idle");
        }
      } else if (response.status === 400) {
        const data = response.data as { message?: string };
        setFileError(data?.message || "Invalid file format or content");
        setStatus("idle");
      } else if (response.status === 401) {
        setGlobalError("Your session has expired. Please log in again.");
        setStatus("idle");
      } else if (response.status === 422) {
        const data = response.data as { message?: string };
        setGlobalError(
          data?.message || "Could not extract transaction data from this image. Please try another image or enter manually."
        );
        setStatus("idle");
      } else if (response.status === 503) {
        setGlobalError(
          "The extraction service is temporarily unavailable. Please try again later or enter manually."
        );
        setStatus("idle");
      } else if (response.status === 500) {
        setGlobalError("An unexpected error occurred. Please try again.");
        setStatus("idle");
      } else {
        setGlobalError("Failed to extract transaction data. Please try again.");
        setStatus("idle");
      }
    } catch {
      setGlobalError("Network error. Failed to extract transaction data.");
      setStatus("idle");
    }
  }, [selectedFile, token, transactionType]);

  const handleConfirm = () => {
    if (extracted) {
      onConfirm(extracted);
    }
  };

  const handleEdit = () => {
    if (extracted) {
      onEdit(extracted);
    }
  };

  const getCategoryLabel = (category: string): string => {
    if (transactionType === "EXPENSE") {
      return CATEGORY_DISPLAY_MAP[category] || category;
    } else {
      return INCOME_CATEGORY_DISPLAY_MAP[category] || category;
    }
  };

  if (extracted) {
    return (
      <div className="flex flex-col gap-6 py-4 px-2">
        {/* Extracted Data Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Date</p>
                <p className="text-base text-gray-900 mt-1">{extracted.date}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Amount</p>
                <p className="text-base text-gray-900 mt-1">
                  ${extracted.amount?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Category</p>
                <p className="text-base text-gray-900 mt-1">
                  {getCategoryLabel(
                    extracted.expenseCategory || extracted.incomeCategory || ""
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Description</p>
                <p className="text-base text-gray-900 mt-1 truncate">
                  {extracted.description}
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleEdit}>
                Edit
              </Button>
              <Button onClick={handleConfirm}>Confirm</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4 px-2">
      {globalError && (
        <div className="rounded-md bg-red-100 border border-red-300 text-red-800 px-4 py-2 text-sm">
          {globalError}
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <FieldLabel htmlFor="vlm-upload">Upload Receipt or Invoice</FieldLabel>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="size-4 text-gray-500 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              Supported: JPEG, PNG, PDF · Max size: 5 MB
            </TooltipContent>
          </Tooltip>
        </div>

        <input
          ref={fileInputRef}
          id="vlm-upload"
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleInputChange}
          className="hidden"
        />

        <Card
          className={`cursor-pointer transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                  className="size-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {selectedFile ? selectedFile.name : "Drag and drop your receipt here"}
              </p>
              <p className="text-xs text-gray-500">
                or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-2">
                JPEG, PNG, PDF · Max 5 MB
              </p>
            </div>
          </CardContent>
        </Card>

        {fileError && <FieldError>{fileError}</FieldError>}
      </div>

      <Button
        onClick={handleExtractData}
        disabled={!selectedFile || status === "uploading"}
        className="w-full"
      >
        {status === "uploading" ? (
          <>
            <Spinner className="mr-2 size-4" />
            Processing...
          </>
        ) : (
          "Extract Data"
        )}
      </Button>
    </div>
  );
}
