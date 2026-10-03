import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <Card className="w-full max-w-sm border-navy/10 shadow-lg">
        <CardHeader className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center font-serif text-2xl bg-navy text-gold mb-2">
            K
          </span>
          <CardTitle className="font-serif text-2xl text-navy">Kishaa CMS</CardTitle>
          <p className="text-xs text-navy/60 mt-1">Staff Portal & Content Management</p>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full bg-gold hover:bg-gold-dark text-navy font-semibold uppercase tracking-wider text-xs py-3"
            size="lg"
            onClick={() => {
              window.location.href = "/admin";
            }}
          >
            Go to Staff Sign-in
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
