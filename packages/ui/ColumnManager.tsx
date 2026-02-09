/**
 * Column Manager Component
 * Modal-based column visibility manager with customizable styling
 */

import React, { useState, useEffect, useRef } from "react";

export interface ColumnManagerStyles {
  button?: React.CSSProperties;
  backdrop?: React.CSSProperties;
  modal?: React.CSSProperties;
  header?: React.CSSProperties;
  content?: React.CSSProperties;
  label?: React.CSSProperties;
  checkbox?: React.CSSProperties;
  actionButtons?: React.CSSProperties;
  closeButton?: React.CSSProperties;
}

export interface ColumnManagerProps<TData> {
  columns: Array<{ id: string; header?: string }>;
  columnVisibility: Record<string, boolean>;
  onToggleVisibility: (columnId: string) => void;
  onSetVisibility?: (columnId: string, visible: boolean) => void;
  onSetAllVisibility?: (visibility: Record<string, boolean>) => void;
  className?: string;
  buttonClassName?: string;
  modalClassName?: string;
  styles?: ColumnManagerStyles;
  buttonText?: string;
  title?: string;
}

/**
 * ColumnManager Component
 * 
 * A modal-based component for managing column visibility in data tables.
 * 
 * @example
 * ```tsx
 * const table = useDataTable({ data, columns });
 * 
 * <ColumnManager
 *   columns={table.columns}
 *   columnVisibility={table.state.columnVisibility}
 *   onToggleVisibility={(id) => table.columnManagement.toggleVisibility(id)}
 * />
 * ```
 */
export function ColumnManager<TData>({
  columns,
  columnVisibility,
  onToggleVisibility,
  onSetVisibility,
  onSetAllVisibility,
  className,
  buttonClassName,
  modalClassName,
  styles,
  buttonText = "Column Manager",
  title = "Toggle Column Visibility",
}: ColumnManagerProps<TData>) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  const defaultButtonStyle: React.CSSProperties = {
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  };

  const defaultBackdropStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const defaultModalStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
    maxWidth: "500px",
    width: "90%",
    maxHeight: "80vh",
    overflow: "auto",
    position: "relative",
  };

  return (
    <>
      <div className={className} style={{ marginBottom: "20px" }}>
        <button
          className={buttonClassName}
          onClick={() => setIsOpen(true)}
          style={{ ...defaultButtonStyle, ...styles?.button }}
        >
          {buttonText}
        </button>
      </div>

      {isOpen && (
        <div
          onClick={handleBackdropClick}
          style={{ ...defaultBackdropStyle, ...styles?.backdrop }}
        >
          <div
            ref={modalRef}
            className={modalClassName}
            style={{ ...defaultModalStyle, ...styles?.modal }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                ...styles?.header,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                {title}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: "0",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                  ...styles?.closeButton,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div
              style={{
                padding: "20px",
                ...styles?.content,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {columns.map((column) => {
                  const isVisible = columnVisibility[column.id] !== false;
                  return (
                    <label
                      key={column.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        padding: "8px",
                        borderRadius: "4px",
                        transition: "background-color 0.2s",
                        ...styles?.label,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f3f4f6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => onToggleVisibility(column.id)}
                        style={{
                          width: "16px",
                          height: "16px",
                          cursor: "pointer",
                          ...styles?.checkbox,
                        }}
                      />
                      <span style={{ fontSize: "14px", userSelect: "none", flex: 1 }}>
                        {column.header || column.id}
                      </span>
                      {!isVisible && (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            fontStyle: "italic",
                          }}
                        >
                          (hidden)
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "16px",
                  borderTop: "1px solid #e5e7eb",
                  display: "flex",
                  gap: "8px",
                  ...styles?.actionButtons,
                }}
              >
                <button
                  onClick={() => {
                    // Show all columns - batch update if available
                    if (onSetAllVisibility) {
                      const newVisibility: Record<string, boolean> = {};
                      columns.forEach((col) => {
                        newVisibility[col.id] = true;
                      });
                      onSetAllVisibility(newVisibility);
                    } else if (onSetVisibility) {
                      // Fallback: set each column individually
                      columns.forEach((col) => {
                        onSetVisibility(col.id, true);
                      });
                    } else {
                      // Fallback: toggle each hidden column
                      columns.forEach((col) => {
                        if (columnVisibility[col.id] === false) {
                          onToggleVisibility(col.id);
                        }
                      });
                    }
                  }}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    flex: 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#059669";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#10b981";
                  }}
                >
                  Show All
                </button>
                <button
                  onClick={() => {
                    // Hide all columns except the first one - batch update if available
                    if (onSetAllVisibility) {
                      const newVisibility: Record<string, boolean> = { ...columnVisibility };
                      columns.forEach((col, index) => {
                        if (index > 0) {
                          newVisibility[col.id] = false;
                        } else {
                          newVisibility[col.id] = true; // Keep first column visible
                        }
                      });
                      onSetAllVisibility(newVisibility);
                    } else if (onSetVisibility) {
                      // Fallback: set each column individually
                      columns.forEach((col, index) => {
                        if (index > 0) {
                          onSetVisibility(col.id, false);
                        }
                      });
                    } else {
                      // Fallback: toggle each visible column (except first)
                      columns.forEach((col, index) => {
                        if (index > 0 && columnVisibility[col.id] !== false) {
                          onToggleVisibility(col.id);
                        }
                      });
                    }
                  }}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    flex: 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#dc2626";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ef4444";
                  }}
                >
                  Hide All (except first)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

