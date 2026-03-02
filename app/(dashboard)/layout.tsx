
import { AppSidebar } from "../components/sidebar";
import { AppHeader } from "../components/header";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen">
            <AppSidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <AppHeader />
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
