import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md mx-auto rounded-3xl shadow-sm">
        <CardContent className="pt-6 text-center">
          <div className="flex mb-4 gap-2 justify-center text-red-500">
            <AlertCircle className="h-12 w-12" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 font-display">404 Page Not Found</h1>
          <p className="mt-4 text-sm text-gray-600 mb-6">
            We couldn't find the page you were looking for. It might have been moved or deleted.
          </p>

          <Link href="/">
            <Button className="w-full h-12 rounded-xl text-lg font-semibold">
              Return Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
