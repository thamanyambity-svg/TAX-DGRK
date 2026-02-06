
export default function VerifyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // This layout will isolate the verification page, removing the sidebar and header.
    // It renders just the children (the verification card) on a blank canvas.
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
            {children}
        </div>
    );
}
