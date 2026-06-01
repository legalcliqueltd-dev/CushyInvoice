import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, Crown, RefreshCw, Trash2, Sun, Moon, Monitor, Landmark, User, Building2, CreditCard, SlidersHorizontal, Palette, Shield, Lock, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useSubscription } from "@/hooks/useSubscription";
import { LogoUploadDialog } from "@/components/LogoUploadDialog";
import { useTheme } from "@/hooks/useTheme";

interface ProfileData {
  company_name: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  company_logo: string;
  default_tax_rate: number;
  default_currency: string;
  bank_name: string;
  bank_account_number: string;
  bank_routing_code: string;
}

interface SubscriptionData {
  subscribed: boolean;
  status: string;
  current_plan: string | null;
  subscription_end: string | null;
  trial_end: string | null;
}

export default function Settings() {
  const [profile, setProfile] = useState<ProfileData>({
    company_name: "",
    full_name: "",
    email: "",
    phone: "",
    address: "",
    company_logo: "",
    default_tax_rate: 0,
    default_currency: "USD",
    bank_name: "",
    bank_account_number: "",
    bank_routing_code: "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [isIOSNative] = useState<boolean>(() => {
    const cap = (window as any).Capacitor;
    const platform = cap?.getPlatform?.();
    return platform === "ios" || platform === "ipad" || (cap?.isNativePlatform?.() ?? false);
  });
  const { 
    subscription, 
    loading: subscriptionLoading, 
    checkSubscription, 
    openCustomerPortal,
    managePaystackSubscription,
  } = useSubscription();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    fetchProfile();
  }, []);

  const openAppleSubscriptions = async () => {
    const url = "https://apps.apple.com/account/subscriptions";
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url });
    } catch {
      window.location.href = url;
    }
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          company_name: data.company_name || "",
          full_name: data.full_name || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
          address: data.address || "",
          company_logo: data.company_logo || "",
          default_tax_rate: Number(data.default_tax_rate) || 0,
          default_currency: data.default_currency || "USD",
          bank_name: (data as any).bank_name || "",
          bank_account_number: (data as any).bank_account_number || "",
          bank_routing_code: (data as any).bank_routing_code || "",
        });
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error fetching profile:", error);
      }
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: profile.company_name,
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          default_tax_rate: profile.default_tax_rate,
          default_currency: profile.default_currency,
          bank_name: profile.bank_name || null,
          bank_account_number: profile.bank_account_number || null,
          bank_routing_code: profile.bank_routing_code || null,
        } as any)
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error updating profile:", error);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (blob: Blob) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (profile.company_logo) {
        const oldPath = profile.company_logo.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("company-logos")
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      const fileName = `${Date.now()}.png`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, blob, { contentType: "image/png" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("company-logos")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ company_logo: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, company_logo: publicUrl });
      toast({ title: "Success", description: "Logo uploaded successfully" });
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error uploading logo:", error);
      }
      toast({ title: "Error", description: error.message || "Failed to upload logo", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (profile.company_logo) {
        const oldPath = profile.company_logo.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("company-logos")
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({ company_logo: null })
        .eq("id", user.id);

      if (error) throw error;

      setProfile({ ...profile, company_logo: "" });
      toast({ title: "Success", description: "Logo removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to remove logo", variant: "destructive" });
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      toast({ title: "Error", description: "Please enter your current password", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("User email not found");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast({ title: "Error", description: "Current password is incorrect", variant: "destructive" });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: "Success", description: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error updating password:", error);
      }
      toast({ title: "Error", description: error.message || "Failed to update password", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and invoice preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 neo-card-subtle h-auto gap-1 p-1.5">
            <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 min-h-[48px] text-xs sm:text-sm">
              <User className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 min-h-[48px] text-xs sm:text-sm">
              <Building2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span>Company</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 min-h-[48px] text-xs sm:text-sm">
              <CreditCard className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span>Billing</span>
            </TabsTrigger>
            <TabsTrigger value="defaults" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 min-h-[48px] text-xs sm:text-sm">
              <SlidersHorizontal className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span>Defaults</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 min-h-[48px] text-xs sm:text-sm">
              <Palette className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span>Theme</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 min-h-[48px] text-xs sm:text-sm">
              <Shield className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-6">
            <Card className="neo-card-subtle">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                    <CardDescription>
                      Your profile and contact details
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile_full_name">Full Name</Label>
                    <Input
                      id="profile_full_name"
                      value={profile.full_name}
                      onChange={(e) =>
                        setProfile({ ...profile, full_name: e.target.value })
                      }
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile_email">Email</Label>
                    <Input
                      id="profile_email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile_phone">Phone Number</Label>
                    <Input
                      id="profile_phone"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_address">Contact Address</Label>
                  <Textarea
                    id="profile_address"
                    value={profile.address}
                    onChange={(e) =>
                      setProfile({ ...profile, address: e.target.value })
                    }
                    placeholder="123 Main Street&#10;City, State 12345"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleProfileUpdate} disabled={saving} className="neo-btn-subtle">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="neo-card-subtle">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Account Security</CardTitle>
                    <CardDescription>
                      Password and security settings
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <button
                  onClick={() => {
                    const securityTab = document.querySelector('[value="security"]') as HTMLButtonElement;
                    securityTab?.click();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Change Password</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </button>
              </CardContent>
            </Card>

            {/* Danger Zone — Delete Account */}
            <Card className="neo-card-subtle border-destructive/40">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-destructive">Delete Account</CardTitle>
                    <CardDescription>
                      Permanently delete your account and all associated data
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. All your invoices, clients, products,
                  and billing history will be permanently erased.
                </p>
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  onClick={() => setDeleteAccountDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-4 mt-6">
            <Card className="neo-card-subtle">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Company Information</CardTitle>
                    <CardDescription>
                      Details that appear on your invoices
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={profile.company_name}
                      onChange={(e) =>
                        setProfile({ ...profile, company_name: e.target.value })
                      }
                      placeholder="Acme Corporation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Contact Name</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) =>
                        setProfile({ ...profile, full_name: e.target.value })
                      }
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={profile.address}
                    onChange={(e) =>
                      setProfile({ ...profile, address: e.target.value })
                    }
                    placeholder="123 Business St, Suite 100&#10;City, State 12345"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="flex items-center gap-4">
                    {profile.company_logo && (
                      <img
                        src={profile.company_logo}
                        alt="Company logo"
                        className="h-16 w-16 object-contain border rounded-lg bg-white"
                      />
                    )}
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setLogoDialogOpen(true)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {profile.company_logo ? "Change Logo" : "Upload Logo"}
                        </Button>
                        {profile.company_logo && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleRemoveLogo}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        PNG or JPG. Supports cropping &amp; background removal.
                      </p>
                    </div>
                  </div>
                </div>

                <LogoUploadDialog
                  open={logoDialogOpen}
                  onOpenChange={setLogoDialogOpen}
                  onUpload={handleLogoUpload}
                />

                <div className="flex justify-end pt-2">
                  <Button onClick={handleProfileUpdate} disabled={saving} className="neo-btn-subtle">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4 mt-6">
            <Card className="neo-card-subtle">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Subscription & Billing</CardTitle>
                    <CardDescription>
                      Manage your plan and payment method
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div>
                      <h3 className="font-medium">Current Plan</h3>
                      <p className="text-sm text-muted-foreground">
                        {subscription.subscribed ? (
                          <>
                            <span className="capitalize">{subscription.current_plan}</span> Plan
                            {subscription.status === 'trialing' && subscription.trial_end ? (
                              <> - Trial ends on {new Date(subscription.trial_end).toLocaleDateString()}</>
                            ) : subscription.subscription_end ? (
                              <> - Renews on {new Date(subscription.subscription_end).toLocaleDateString()}</>
                            ) : null}
                          </>
                        ) : (
                          "Free Plan"
                        )}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      subscription.status === 'trialing'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : subscription.subscribed 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {subscription.status === 'trialing' ? 'Trial' : subscription.subscribed ? 'Active' : 'Free'}
                    </div>
                  </div>

                  {!subscription.subscribed && (
                    <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                      <h4 className="font-semibold text-lg mb-2">Upgrade to Premium</h4>
                      <ul className="text-sm space-y-2 mb-4">
                        <li className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-primary" />
                          <span>Unlimited invoices & clients</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-primary" />
                          <span>No advertisements</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-primary" />
                          <span>Priority support</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-primary" />
                          <span>Advanced features</span>
                        </li>
                      </ul>
                      <Button 
                        onClick={() => window.location.href = '/subscribe'}
                        className="w-full"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade Now
                      </Button>
                    </div>
                  )}

                  {subscription.subscribed && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Premium Features</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Unlimited invoices</li>
                        <li>Unlimited clients</li>
                        <li>No advertisements</li>
                        <li>Payment tracking</li>
                        <li>PDF export</li>
                        <li>Email delivery</li>
                        <li>Payment reminders</li>
                        {subscription.current_plan === 'yearly' && (
                          <>
                            <li>Priority support</li>
                            <li>Advanced reporting</li>
                          </>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t space-y-3">
                  {isIOSNative && subscription.subscribed ? (
                    /* iOS: Apple requires all subscription management to go through Apple ID Settings */
                    <>
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Crown className="h-4 w-4 text-primary" />
                          Manage your subscription
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Your subscription is billed through your Apple ID. To change your plan, update
                          your payment method, or cancel, please use Apple's subscription settings.
                        </p>
                      </div>
                      <Button
                        onClick={openAppleSubscriptions}
                        className="w-full sm:w-auto"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Open Apple Subscription Settings
                      </Button>
                      <Button
                        onClick={checkSubscription}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh status
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Settings → Apple ID → Subscriptions → CushyInvoice
                      </p>
                    </>
                  ) : !isIOSNative && subscription.subscribed && (subscription.provider === "stripe" || subscription.provider === "paystack") ? (
                    <>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {subscription.provider === "paystack" ? (
                          <Button
                            onClick={async () => {
                              try {
                                await managePaystackSubscription("update-card");
                              } catch {}
                            }}
                            className="w-full sm:w-auto"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Update Payment Method
                          </Button>
                        ) : (
                          <Button
                            onClick={openCustomerPortal}
                            className="w-full sm:w-auto"
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            Manage Subscription
                          </Button>
                        )}
                        <Button
                          onClick={checkSubscription}
                          variant="outline"
                          className="w-full sm:w-auto"
                          aria-label="Refresh subscription status"
                        >
                          <RefreshCw className="h-4 w-4 sm:mr-0 mr-2" />
                          <span className="sm:hidden">Refresh status</span>
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setCancelDialogOpen(true)}
                        disabled={cancelLoading}
                      >
                        {cancelLoading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Canceling...</>
                        ) : (
                          "Cancel Subscription"
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        {subscription.provider === "paystack" 
                          ? "Update payment method or cancel your subscription"
                          : "Update payment method, change plan, or manage billing"
                        }
                      </p>
                    </>
                  ) : subscription.subscribed ? (
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={checkSubscription} 
                        variant="outline"
                        size="icon"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Your premium access is active
                      </p>
                    </div>
                  ) : (
                    <>
                      <Button 
                        onClick={() => window.location.href = '/subscribe'}
                        className="w-full bg-gradient-to-r from-primary to-primary/90"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Start Free Trial
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        7 days free, then $2.99/month • Cancel anytime
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defaults" className="space-y-4 mt-6">
            <Card className="neo-card-subtle">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <SlidersHorizontal className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Invoice Defaults</CardTitle>
                    <CardDescription>
                      Default values for new invoices
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default_tax_rate">Default Tax Rate (%)</Label>
                    <Input
                      id="default_tax_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={profile.default_tax_rate}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          default_tax_rate: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Applied to new invoices by default
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default_currency">Default Currency</Label>
                    <Input
                      id="default_currency"
                      value={profile.default_currency}
                      onChange={(e) =>
                        setProfile({ ...profile, default_currency: e.target.value })
                      }
                      placeholder="USD"
                      maxLength={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      3-letter code (e.g., USD, EUR, GBP)
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleProfileUpdate} disabled={saving} className="neo-btn-subtle">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="neo-card-subtle">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Landmark className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Bank Details</CardTitle>
                    <CardDescription>
                      Displayed on invoices for direct payments
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      value={profile.bank_name}
                      onChange={(e) =>
                        setProfile({ ...profile, bank_name: e.target.value })
                      }
                      placeholder="e.g. Chase Bank, Barclays"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_routing_code">Routing / Sort Code</Label>
                    <Input
                      id="bank_routing_code"
                      value={profile.bank_routing_code}
                      onChange={(e) =>
                        setProfile({ ...profile, bank_routing_code: e.target.value })
                      }
                      placeholder="e.g. 021000021"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_account_number">Account Number</Label>
                  <Input
                    id="bank_account_number"
                    value={profile.bank_account_number}
                    onChange={(e) =>
                      setProfile({ ...profile, bank_account_number: e.target.value })
                    }
                    placeholder="e.g. 1234567890"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleProfileUpdate} disabled={saving} className="neo-btn-subtle">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Bank Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4 mt-6">
            <Card className="neo-card-subtle">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Theme</CardTitle>
                    <CardDescription>Choose your preferred appearance</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {([
                    { value: "light" as const, icon: Sun, label: "Light" },
                    { value: "dark" as const, icon: Moon, label: "Dark" },
                    { value: "system" as const, icon: Monitor, label: "System" },
                  ]).map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-colors ${
                        theme === value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        theme === value ? "bg-primary/10" : "bg-muted"
                      }`}>
                        <Icon className={`h-5 w-5 ${theme === value ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <span className={`text-sm font-medium ${theme === value ? "text-primary" : "text-muted-foreground"}`}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-6">
            <Card className="neo-card-subtle">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Change Password</CardTitle>
                    <CardDescription>
                      Update your account password
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={saving}
                    className="neo-btn-subtle disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {saving ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="neo-card-subtle border-destructive/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-destructive">Delete Account</CardTitle>
                    <CardDescription>
                      Permanently delete your account and all data
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  This action is <strong>permanent and irreversible</strong>. All your invoices, clients, products, templates, and profile data will be deleted.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteAccountDialogOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete My Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Cancel Subscription Dialog */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel? You'll continue to have access to Premium features until the end of your current billing period
                {subscription.subscription_end && (
                  <> ({new Date(subscription.subscription_end).toLocaleDateString()})</>
                )}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={async () => {
                  setCancelDialogOpen(false);
                  if (isIOSNative) {
                    await openAppleSubscriptions();
                    return;
                  }
                  if (subscription.provider === "paystack") {
                    setCancelLoading(true);
                    try {
                      await managePaystackSubscription("cancel");
                    } catch {} finally {
                      setCancelLoading(false);
                    }
                  } else {
                    openCustomerPortal();
                  }
                }}
              >
                Continue to Cancel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Account Dialog */}
        <AlertDialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account Permanently</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account and all associated data including invoices, clients, products, expenses, templates, and payment records. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteAccountLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteAccountLoading}
                onClick={async (e) => {
                  e.preventDefault();
                  setDeleteAccountLoading(true);
                  try {
                    const { error } = await supabase.functions.invoke("delete-account");
                    if (error) throw error;
                    await supabase.auth.signOut();
                    toast({ title: "Account deleted", description: "Your account and all data have been permanently deleted." });
                    window.location.href = "/";
                  } catch (err: any) {
                    toast({ title: "Error", description: err.message || "Failed to delete account", variant: "destructive" });
                  } finally {
                    setDeleteAccountLoading(false);
                    setDeleteAccountDialogOpen(false);
                  }
                }}
              >
                {deleteAccountLoading ? "Deleting..." : "Delete Permanently"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
