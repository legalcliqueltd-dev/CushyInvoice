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
import { Upload, Loader2, Crown, RefreshCw, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubscription } from "@/hooks/useSubscription";
import { LogoUploadDialog } from "@/components/LogoUploadDialog";

interface ProfileData {
  company_name: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  company_logo: string;
  default_tax_rate: number;
  default_currency: string;
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
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const { 
    subscription, 
    loading: subscriptionLoading, 
    checkSubscription, 
    openCustomerPortal 
  } = useSubscription();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

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
        })
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

      // Delete old logo if exists
      if (profile.company_logo) {
        const oldPath = profile.company_logo.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("company-logos")
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new logo
      const fileName = `${Date.now()}.png`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, blob, { contentType: "image/png" });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("company-logos")
        .getPublicUrl(filePath);

      // Update profile with new logo URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ company_logo: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, company_logo: publicUrl });
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error uploading logo:", error);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "Logo removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove logo",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      toast({
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // First, verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error("User email not found");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: "Error",
          description: "Current password is incorrect",
          variant: "destructive",
        });
        return;
      }

      // If verification succeeds, update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error updating password:", error);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
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
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and invoice preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5 neo-card-subtle">
            <TabsTrigger value="profile">My Profile</TabsTrigger>
            <TabsTrigger value="company">Company Info</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="defaults">Invoice Defaults</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card className="neo-card-subtle">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Manage your personal profile and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <p className="text-xs text-muted-foreground">
                    Email is managed through your account authentication
                  </p>
                </div>

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

                <Button onClick={handleProfileUpdate} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>
                  Manage your password and security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  To change your password, please visit the Security tab.
                </p>
                <Button variant="outline" onClick={() => {
                  const securityTab = document.querySelector('[value="security"]') as HTMLButtonElement;
                  securityTab?.click();
                }}>
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Update your company details that appear on invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed here
                  </p>
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
                        className="h-16 w-16 object-contain border rounded bg-white"
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

                <Button onClick={handleProfileUpdate} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscription & Billing</CardTitle>
                <CardDescription>
                  Manage your subscription plan and payment method
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                  {subscription.subscribed ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={openCustomerPortal} 
                          className="flex-1 sm:flex-none"
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Manage Subscription
                        </Button>
                        <Button 
                          onClick={checkSubscription} 
                          variant="outline"
                          size="icon"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setCancelDialogOpen(true)}
                      >
                        Cancel Subscription
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Update payment method, change plan, or manage billing
                      </p>
                    </>
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

          <TabsContent value="defaults" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Defaults</CardTitle>
                <CardDescription>
                  Set default values for new invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    This rate will be applied to new invoices by default
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
                    Enter 3-letter currency code (e.g., USD, EUR, GBP)
                  </p>
                </div>

                <Button onClick={handleProfileUpdate} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Defaults
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your account password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <Button onClick={handlePasswordChange} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Password
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
                onClick={() => {
                  setCancelDialogOpen(false);
                  openCustomerPortal();
                }}
              >
                Continue to Cancel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
