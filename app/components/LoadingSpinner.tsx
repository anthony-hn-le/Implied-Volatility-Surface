interface LoadingSpinnerProps {
  overlay?: boolean;
}

export default function LoadingSpinner({ overlay = false }: LoadingSpinnerProps) {
  return (
    <div
      style={{
        position: overlay ? "absolute" : "static",
        inset: overlay ? 0 : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: overlay ? "rgba(8, 12, 21, 0.6)" : "transparent",
        borderRadius: overlay ? "10px" : undefined,
        minHeight: overlay ? undefined : "600px",
        zIndex: 2,
      }}
    >
      <div className="spinner" />
    </div>
  );
}
