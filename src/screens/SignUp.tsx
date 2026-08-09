// src/screens/SignUp.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ArrowLeft, 
  User, 
  MoreHorizontal, 
  Check, 
  Eye, 
  EyeOff, 
  Loader2,
  Upload,
  Plus,
  Trash2,
  MapPin,
  Pencil,
  Store,
  X,
  Shirt,
  Sparkles,
  ShoppingBag,
  Tag,
  Layers,
  ChevronDown,
  ShieldCheck,
  Infinity,
  Zap,
  Lock,
  PartyPopper,
  Globe,
  Link,
  Copy,
  ExternalLink,
  Search,
  Home,
  Grid,
  Heart,
  Share2,
  Mail,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useShopContext } from '../context/ShopContext';
import { FREE_TRIAL_DAYS } from '../lib/plans';
import { uploadImage } from '../utils/uploadImage';
import { paymentService } from '../services/paymentService';
import { SuccessScreen } from '../components/onboarding/SuccessScreen';

// Brand SVGs
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-5 h-5 fill-current text-black" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.34V9.37a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.86-.8z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-5 h-5 text-pink-600 fill-current" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="w-5 h-5 text-[#25D366] fill-current" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

const NardoPayIcon = () => (
  <div className="flex items-center gap-1 font-black text-sm tracking-tight">
    <span className="text-[#1877F2]">NARDO</span>
    <span className="text-[#FF9900]">PAY</span>
  </div>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5 text-[#1877F2] fill-current" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// Zimbabwe Fashion Bio Suggestions
const BIO_PRESETS = [
  {
    id: 'Streetwear brand',
    title: 'Streetwear brand',
    icon: Shirt,
    text: 'Streetwear brand bringing you the freshest fits in Zimbabwe. Quality pieces. Clean designs. Made for the culture.'
  },
  {
    id: 'Sneaker store',
    title: 'Sneaker store',
    icon: ShoppingBag,
    text: 'Sneakers, streetwear & more. 100% authentic kicks delivered across Zimbabwe.'
  },
  {
    id: 'Thrift store',
    title: 'Thrift store',
    icon: Tag,
    text: 'Thrifted. Curated. Delivered. Handpicked vintage & pre-loved fashion.'
  },
  {
    id: 'Premium fashion',
    title: 'Premium fashion',
    icon: Sparkles,
    text: 'Premium pieces. Made for Zimbabwe. High quality fashion for everyday luxury.'
  },
  {
    id: 'Local clothing brand',
    title: 'Local clothing brand',
    icon: MapPin,
    text: 'Independent clothing brand from Zimbabwe 🇿🇼 Designed & crafted locally.'
  },
  {
    id: 'Vintage clothing',
    title: 'Vintage clothing',
    icon: Layers,
    text: 'Classic vintage style & retro fashion curated for the culture.'
  },
  {
    id: 'Custom clothing',
    title: 'Custom clothing',
    icon: Pencil,
    text: 'Custom fashion & exclusive drops. Bespoke pieces made to stand out.'
  },
  {
    id: 'Fashion & accessories',
    title: 'Fashion & accessories',
    icon: Store,
    text: 'Curated fashion & accessories. Your plug for the latest drip.'
  },
  {
    id: 'Other',
    title: 'Other',
    icon: MoreHorizontal,
    text: 'Your plug for the latest drip in Zimbabwe.'
  }
];

interface SignUpProps {
  initialStep?: number;
}

export const SignUp: React.FC<SignUpProps> = ({ initialStep }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stepParam = searchParams.get('step');
  const modeParam = searchParams.get('mode');
  const { session } = useAuth();
  const { shop, refreshShop } = useShopContext();

  // Active step (1 to 13)
  const [step, setStep] = useState<number>(() => {
    if (stepParam) {
      const parsed = parseInt(stepParam, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 13) return parsed;
    }
    if (initialStep !== undefined) return Math.min(13, Math.max(1, initialStep));
    return 1;
  });
  const [viewMode, setViewMode] = useState<'flow' | 'overview'>(modeParam === 'cards' ? 'overview' : 'flow');

  // Screen 1 - 4 state
  const [shopName, setShopName] = useState('');
  const [referrer, setReferrer] = useState('TikTok');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+263');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active shop record ID created during signup, persisted in localStorage
  const [createdShopId, setCreatedShopIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('threadzw_created_shop_id');
    } catch (e) {
      return null;
    }
  });

  const setCreatedShopId = (id: string | null) => {
    setCreatedShopIdState(id);
    try {
      if (id) {
        localStorage.setItem('threadzw_created_shop_id', id);
      } else {
        localStorage.removeItem('threadzw_created_shop_id');
      }
    } catch (e) {}
  };

  // Screen 5: Brand identity (Logo & Banner)
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');

  // Screen 6: Bio
  const [selectedBioCategory, setSelectedBioCategory] = useState<string>('');
  const [bioText, setBioText] = useState<string>('');

  // Screen 7: Shop Directions
  const [shopAddress, setShopAddress] = useState<string>('');
  const [shopDirections, setShopDirections] = useState<string>('');
  const [whatsappPhone, setWhatsappPhone] = useState<string>('+263 77 123 4567');

  // Screen 8: First Product
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [productName, setProductName] = useState<string>('');
  const [productPrice, setProductPrice] = useState<string>('');
  const [productStock, setProductStock] = useState<string>('');
  const [productCategory, setProductCategory] = useState<string>('');
  const [productSizes, setProductSizes] = useState<string[]>([]);
  const [productDescription, setProductDescription] = useState<string>('');

  // Sync phone into whatsappPhone if unset
  useEffect(() => {
    if (phone && phone !== '+263' && (!whatsappPhone || whatsappPhone === '+263 77 123 4567')) {
      setWhatsappPhone(phone);
    }
  }, [phone]);

  // Clear auth error when changing steps & skip removed steps 7 and 8
  useEffect(() => {
    setAuthError(null);
    if (step === 7 || step === 8) {
      setStep(9);
    }
  }, [step]);

  // Hearing options list
  const REFERRAL_OPTIONS = [
    { id: 'TikTok', label: 'TikTok', icon: <TikTokIcon /> },
    { id: 'Instagram', label: 'Instagram', icon: <InstagramIcon /> },
    { id: 'Friend', label: 'Friend', icon: <User className="w-5 h-5 text-black" /> },
    { id: 'WhatsApp', label: 'WhatsApp', icon: <WhatsAppIcon /> },
    { id: 'Google', label: 'Google', icon: <GoogleIcon /> },
    { id: 'Facebook', label: 'Facebook', icon: <FacebookIcon /> },
    { id: 'Other', label: 'Other', icon: <MoreHorizontal className="w-5 h-5 text-black" /> },
  ];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+263')) {
      if (val.startsWith('0')) {
        val = '+263' + val.slice(1);
      } else if (!val.startsWith('+')) {
        val = '+263' + val;
      } else {
        val = '+263';
      }
    }
    setPhone(val);
  };

  // Step 4 Submit: Sign Up
  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);

    const emailVal = email.trim();
    const phoneVal = phone.trim();
    const passVal = password.trim();

    if (!emailVal || !passVal) {
      toast.error('Please enter email and password');
      return;
    }

    if (!phoneVal || phoneVal === '+263') {
      toast.error('Please enter your phone number');
      return;
    }

    setLoading(true);

    try {
      let currentUser = null;

      // Always authenticate with the provided email and password to ensure auth.users record exists
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: emailVal,
        password: passVal,
        options: {
          data: {
            full_name: shopName || 'Shop Owner',
            phone_number: phoneVal,
          }
        }
      });

      if (signUpErr) {
        if (signUpErr.message.toLowerCase().includes('already registered')) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: emailVal,
            password: passVal
          });
          if (signInErr) throw signInErr;
          currentUser = signInData.user;
        } else {
          throw signUpErr;
        }
      } else {
        currentUser = signUpData.user;
        if (!signUpData.session) {
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email: emailVal,
            password: passVal
          });
          if (signInData?.user) {
            currentUser = signInData.user;
          }
        }
      }

      if (!currentUser?.id) {
        throw new Error('Authentication failed. Account was not created in Supabase Auth.');
      }

      localStorage.setItem('threadzw_logged_in', 'true');
      localStorage.setItem('supabase_logged_in_user_id', currentUser.id);

      // Create shop record linked to owner_id = currentUser.id
      const slug = shopName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
      const shopPayload = {
        owner_id: currentUser.id,
        name: shopName.trim() || 'My Shop',
        slug: slug || `shop-${Date.now().toString(36)}`,
        category: 'Streetwear & Fashion',
        description: `${shopName} official storefront on ThreadZW.`,
        whatsapp_number: phoneVal || '+263771234567',
        logo_url: logoPreview || null,
        banner_url: bannerPreview || null,
        is_active: true,
      };

      const { data: existingShop } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', currentUser.id)
        .maybeSingle();

      let activeShopId = existingShop?.id;

      if (existingShop) {
        const { error: updateErr } = await supabase.from('shops').update(shopPayload).eq('id', existingShop.id);
        if (updateErr) throw updateErr;
      } else {
        const { data: insertedShop, error: insertErr } = await supabase
          .from('shops')
          .insert(shopPayload)
          .select('id')
          .single();
        if (insertErr) throw insertErr;
        if (insertedShop) activeShopId = insertedShop.id;
      }

      if (!activeShopId) {
        throw new Error('Failed to create shop record in Supabase database.');
      }

      setCreatedShopId(activeShopId);

      try {
        await refreshShop();
      } catch (e) {
        console.warn('refreshShop error:', e);
      }

      toast.success('🎉 Account & shop created successfully!');
      // Continue onboarding flow to Signup Success screen (Step 14)
      setStep(14);

    } catch (err: any) {
      console.error('Sign up error:', err);
      setAuthError(err?.message || 'Failed to sign up');
      toast.error(err?.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  // Step 5 Submit: Upload Brand Identity (Logo & Banner)
  const handleSaveBrand = async () => {
    setLoading(true);
    try {
      const user = session?.user || (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('Please create your account first');
        setStep(4);
        return;
      }

      let targetShopId = createdShopId || shop?.id;

      if (!targetShopId) {
        const { data: dbShop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        if (dbShop) targetShopId = dbShop.id;
      }

      let logoUrl = logoPreview;
      let bannerUrl = bannerPreview;

      // Upload Logo file if selected
      if (logoFile && user) {
        try {
          logoUrl = await uploadImage({
            supabase,
            file: logoFile,
            bucket: 'shop-avatars',
            folder: 'logo',
            userId: targetShopId || user.id
          });
        } catch (e) {
          console.warn('Logo upload note:', e);
        }
      }

      // Upload Banner file if selected
      if (bannerFile && user) {
        try {
          bannerUrl = await uploadImage({
            supabase,
            file: bannerFile,
            bucket: 'shop-banners',
            folder: 'banner',
            userId: targetShopId || user.id
          });
        } catch (e) {
          console.warn('Banner upload note:', e);
        }
      }

      // Persist shop name, logo and banner
      if (targetShopId) {
        const { error: shopErr } = await supabase
          .from('shops')
          .update({
            name: shopName.trim() || 'My Shop',
            logo_url: logoUrl,
            banner_url: bannerUrl
          })
          .eq('id', targetShopId);
        if (shopErr) throw shopErr;
      }

      try { await refreshShop(); } catch (e) {}
      setStep(6);
    } catch (err: any) {
      console.error('Error saving brand identity:', err);
      toast.error(err?.message || 'Error saving brand identity');
    } finally {
      setLoading(false);
    }
  };

  // Step 6 Submit: Save Bio
  const handleSaveBio = async () => {
    setLoading(true);
    try {
      const user = session?.user || (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('Please create your account first');
        setStep(4);
        return;
      }

      let targetShopId = createdShopId || shop?.id;

      if (!targetShopId) {
        const { data: dbShop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        if (dbShop) targetShopId = dbShop.id;
      }

      if (targetShopId) {
        const { error: shopErr } = await supabase
          .from('shops')
          .update({
            description: bioText.trim(),
            category: selectedBioCategory || 'Streetwear & Fashion'
          })
          .eq('id', targetShopId);
        if (shopErr) throw shopErr;
      }

      try { await refreshShop(); } catch (e) {}
      setStep(9);
    } catch (err: any) {
      console.error('Error saving bio:', err);
      toast.error(err?.message || 'Error saving bio');
    } finally {
      setLoading(false);
    }
  };

  // Step 7 Submit: Save Shop Directions
  const handleSaveDirections = async () => {
    setLoading(true);
    try {
      const user = session?.user || (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('Please create your account first');
        setStep(4);
        return;
      }

      let targetShopId = createdShopId || shop?.id;

      if (!targetShopId) {
        const { data: dbShop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        if (dbShop) targetShopId = dbShop.id;
      }

      if (targetShopId) {
        const { error: shopErr } = await supabase
          .from('shops')
          .update({
            location: shopAddress.trim(),
            directions: shopDirections.trim(),
            city: shopAddress.trim(),
            whatsapp_number: whatsappPhone.trim() || phone.trim()
          })
          .eq('id', targetShopId);
        if (shopErr) throw shopErr;
      }

      try { await refreshShop(); } catch (e) {}
      setStep(8);
    } catch (err: any) {
      console.error('Error saving directions:', err);
      toast.error(err?.message || 'Error saving directions');
    } finally {
      setLoading(false);
    }
  };

  // Step 8 Submit: Save First Product
  const handleSaveFirstProduct = async (skip = false) => {
    setLoading(true);
    try {
      const user = session?.user || (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('Please create your account first');
        setStep(4);
        return;
      }

      let targetShopId = createdShopId || shop?.id;

      if (!targetShopId) {
        const { data: dbShop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        if (dbShop) targetShopId = dbShop.id;
      }

      if (!skip && productName.trim() && targetShopId) {
        let finalImages = [...productImages];

        // Upload new product files if present
        if (productFiles.length > 0 && user) {
          for (const file of productFiles) {
            try {
              const url = await uploadImage({
                supabase,
                file,
                bucket: 'product-images',
                folder: 'product',
                userId: targetShopId
              });
              finalImages.push(url);
            } catch (e) {
              console.warn('Product file upload note:', e);
            }
          }
        }

        const priceNum = parseFloat(productPrice) || 35.0;
        const stockNum = parseInt(productStock) || 10;

        const productPayload = {
          shop_id: targetShopId,
          name: productName.trim(),
          price: priceNum,
          stock: stockNum,
          total_stock: stockNum,
          category: productCategory || 'Hoodies',
          description: productDescription.trim(),
          images: finalImages,
          image_url: finalImages[0] || null,
          sizes: productSizes,
          is_published: true,
          status: 'active',
          created_at: new Date().toISOString()
        };

        const { error: prodErr } = await supabase
          .from('products')
          .insert(productPayload);

        if (prodErr) {
          console.error('Error inserting product:', prodErr);
          throw prodErr;
        }
      }

      try { await refreshShop(); } catch (e) {}
      toast.success('Product saved!');
      setStep(9);
    } catch (err: any) {
      console.error('Error in first product setup:', err);
      toast.error(err?.message || 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  // Step 11 Submit: Handle Nardo Pay Payment
  const handlePayment = async () => {
    setLoading(true);
    try {
      const user = session?.user || (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('Please create your account first before paying');
        setStep(4);
        return;
      }

      let targetShopId = createdShopId || shop?.id;

      if (!targetShopId) {
        const { data: dbShop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        if (dbShop) targetShopId = dbShop.id;
      }

      if (targetShopId && user?.id) {
        await paymentService.createPaymentSession({
          shopId: targetShopId,
          userId: user.id,
          amount: 20.0,
          currency: 'USD',
          provider: 'nardopay'
        });
      }

      try { await refreshShop(); } catch (e) {}

      // Open official Nardo Pay link
      window.open('https://nardopay.com/pay/efb2bff4ee35cc08', '_blank');

      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success('Redirected to Nardo Pay payment.');
      setStep(12);
    } catch (err: any) {
      console.error('Payment error:', err);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 12 Submit: Go to Screen 13 Activation
  const handleFinishOnboarding = () => {
    setStep(13);
  };

  // Step 13 Submit: Final Account Activation & Dashboard Link
  const handleActivateAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      const emailVal = email.trim();
      const passVal = password.trim();

      if (!emailVal) {
        toast.error('Please enter your email address');
        setLoading(false);
        return;
      }

      if (!passVal) {
        toast.error('Please enter a password');
        setLoading(false);
        return;
      }

      if (passVal.length < 6) {
        toast.error('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      let activeUser = null;

      // First attempt to sign in with password
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: emailVal,
        password: passVal
      });

      if (signInErr) {
        // If sign in fails, attempt sign up in case account was not created
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: emailVal,
          password: passVal,
          options: {
            data: {
              full_name: shopName || 'Shop Owner',
              phone_number: phone || '',
            }
          }
        });

        if (signUpErr) {
          throw new Error(signInErr.message || signUpErr.message || 'Authentication failed');
        }

        activeUser = signUpData.user;
        if (!signUpData.session) {
          const { data: sData } = await supabase.auth.signInWithPassword({
            email: emailVal,
            password: passVal
          });
          if (sData?.user) activeUser = sData.user;
        }
      } else {
        activeUser = signInData.user;
      }

      if (!activeUser?.id) {
        throw new Error('Authentication failed. Account does not exist in Supabase.');
      }

      let targetShopId = createdShopId || localStorage.getItem('threadzw_created_shop_id') || shop?.id;
      if (!targetShopId && activeUser?.id) {
        const { data: dbShop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', activeUser.id)
          .maybeSingle();

        if (dbShop) {
          targetShopId = dbShop.id;
        } else {
          // If still no shop found, fetch the most recent shop created without owner_id or for this session
          const { data: recentShops } = await supabase
            .from('shops')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1);
          if (recentShops && recentShops.length > 0) {
            targetShopId = recentShops[0].id;
          }
        }
      }

      const nowIso = new Date().toISOString();
      const cleanSlug = (shopName || 'shop').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const shopPayload = {
        owner_id: activeUser.id,
        name: shopName.trim() || 'My Shop',
        slug: cleanSlug || `shop-${Date.now().toString(36)}`,
        logo_url: logoPreview || null,
        banner_url: bannerPreview || null,
        description: bioText.trim() || null,
        category: selectedBioCategory || 'Streetwear & Fashion',
        location: shopAddress.trim() || null,
        directions: shopDirections.trim() || null,
        city: shopAddress.trim() || null,
        whatsapp_number: whatsappPhone.trim() || phone.trim() || null,
        is_active: true,
        payment_status: 'paid',
        payment_required: false,
        paid_at: nowIso
      };

      if (targetShopId) {
        const { error: updateErr } = await supabase
          .from('shops')
          .update(shopPayload)
          .eq('id', targetShopId);
        if (updateErr) throw updateErr;
      } else {
        const { data: newShop, error: insertErr } = await supabase
          .from('shops')
          .insert(shopPayload)
          .select('id')
          .single();
        if (insertErr) throw insertErr;
        if (newShop) targetShopId = newShop.id;
      }

      if (!targetShopId) {
        throw new Error('Failed to create or activate shop in Supabase database.');
      }

      setCreatedShopId(targetShopId);

      if (productName.trim()) {
        try {
          const priceNum = parseFloat(productPrice) || 35.0;
          const stockNum = parseInt(productStock) || 10;
          const productPayload = {
            shop_id: targetShopId,
            name: productName.trim(),
            price: priceNum,
            stock: stockNum,
            total_stock: stockNum,
            category: productCategory || 'Hoodies',
            description: productDescription.trim(),
            images: productImages,
            image_url: productImages[0] || null,
            sizes: productSizes,
            is_published: true,
            status: 'active',
            created_at: nowIso
          };
          await supabase.from('products').insert(productPayload);
        } catch (prodErr) {
          console.warn('Product insert note during activation:', prodErr);
        }
      }

      await paymentService.activateShopPayment({
        shopId: targetShopId,
        userId: activeUser.id,
        paymentReference: `NARDOPAY-${Date.now()}`
      });

      // Fetch fresh shop record to ensure localStorage cache & state are fully updated
      const { data: freshShop } = await supabase
        .from('shops')
        .select('*')
        .eq('id', targetShopId)
        .maybeSingle();

      if (freshShop) {
        localStorage.setItem(`shop_${activeUser.id}`, JSON.stringify(freshShop));
      }

      localStorage.setItem('threadzw_logged_in', 'true');
      localStorage.setItem('supabase_logged_in_user_id', activeUser.id);

      try { await refreshShop(); } catch (e) {}

      toast.success('🎉 Account authenticated & shop activated!');
      setStep(13);
    } catch (err: any) {
      console.error('Account activation error:', err);
      setAuthError(err?.message || 'Failed to activate account');
      toast.error(err?.message || 'Failed to activate account');
    } finally {
      setLoading(false);
    }
  };

  // Image Upload Local File Handlers
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleProductImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArr = Array.from(files);
      setProductFiles(prev => [...prev, ...fileArr]);
      const newUrls = fileArr.map(f => URL.createObjectURL(f));
      setProductImages(prev => [...prev, ...newUrls]);
    }
  };

  const toggleSize = (size: string) => {
    if (productSizes.includes(size)) {
      setProductSizes(productSizes.filter(s => s !== size));
    } else {
      setProductSizes([...productSizes, size]);
    }
  };

  // Helper component for Progress bar
  const ProgressIndicator = ({ activeStep, totalSteps = 4 }: { activeStep: number; totalSteps?: number }) => (
    <div className="flex items-center gap-1.5 w-32 sm:w-40">
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const s = idx + 1;
        return (
          <div
            key={s}
            className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
              s <= activeStep ? 'bg-[#C6FF00]' : 'bg-zinc-200'
            }`}
          />
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased flex flex-col items-center justify-between selection:bg-[#C6FF00]">
      
      {/* MODE 1: INTERACTIVE STEP-BY-STEP FLOW */}
      {viewMode === 'flow' && (
        <div className="w-full max-w-md mx-auto min-h-screen p-6 sm:p-8 flex flex-col justify-between relative">
            
            <AnimatePresence mode="wait">
              
              {/* ========================================= */}
              {/* SCREEN 1: WELCOME */}
              {/* ========================================= */}
              {step === 1 && (
                <motion.div
                  key="screen1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Logo */}
                  <div className="pt-2">
                    <div className="space-y-0.5">
                      <h2 className="text-2xl font-black tracking-tight text-black">
                        THREAD<span className="text-[#C6FF00]">ZW</span>
                      </h2>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                        SELL MORE. STRESS LESS.
                      </p>
                    </div>
                  </div>

                  {/* Headlines */}
                  <div className="py-6 space-y-3">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-black tracking-tight leading-[1.08]">
                      Launch your<br />
                      clothing store<br />
                      in under<br />
                      <span className="text-[#C6FF00]">60 seconds.</span>
                    </h1>
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed pt-1">
                      No coding. No website builders.<br />
                      Just your brand.
                    </p>
                  </div>

                  {/* Collage Graphic / Image representation */}
                  <div className="py-2 flex items-center justify-center relative">
                    <div className="relative w-full max-w-[280px] h-48 bg-zinc-50 rounded-2xl p-2 border border-zinc-100 flex items-center justify-center overflow-hidden">
                      {/* Left Flatlay Clothing Card */}
                      <img
                        src="https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/save%20it%20for%20later.jfif"
                        alt="Clothing Flatlay"
                        className="w-28 h-36 object-cover rounded-xl shadow-lg -rotate-6 absolute left-2 top-4 border-2 border-white z-10"
                      />
                      {/* Top Right Cap Card */}
                      <img
                        src="https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/download%20(2).jfif"
                        alt="Cap"
                        className="w-24 h-24 object-cover rounded-xl shadow-md rotate-12 absolute right-2 top-2 border-2 border-white z-20"
                      />
                      {/* Bottom Right Trainer / Sweater Card */}
                      <img
                        src="https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/Puma%20Men's%20Trainers%20(1).jfif"
                        alt="Trainers & Drip"
                        className="w-28 h-32 object-cover rounded-xl shadow-lg rotate-3 absolute right-6 bottom-2 border-2 border-white z-0"
                      />
                    </div>
                  </div>

                  {/* Bottom Button */}
                  <div className="pt-6 space-y-3 text-center">
                    <button
                      onClick={() => setStep(2)}
                      className="w-full bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-xs"
                    >
                      <span className="text-black font-extrabold">Get Started</span>
                      <ArrowRight className="w-5 h-5 text-black stroke-[2.5]" />
                    </button>
                    <p className="text-xs text-zinc-400 font-medium">
                      Join thousands of brands in Zimbabwe
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ========================================= */}
              {/* SCREEN 2: ENTER SHOP NAME */}
              {/* ========================================= */}
              {step === 2 && (
                <motion.div
                  key="screen2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Header Nav */}
                  <div className="flex items-center justify-between pt-1 pb-4">
                    <button
                      onClick={() => setStep(1)}
                      className="p-2 -ml-2 rounded-full text-black hover:bg-zinc-100 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <ProgressIndicator activeStep={1} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-6 pt-4">
                    <div className="space-y-2">
                      <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight leading-tight">
                        What’s your<br />shop called?
                      </h1>
                      <p className="text-xs sm:text-sm text-zinc-500 font-normal">
                        This will be the name of your store on ThreadZW.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-black uppercase tracking-wider block">
                        Shop name
                      </label>
                      <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="e.g. Plusher, Nardo, Drip Cartel"
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-4 text-sm font-semibold text-black placeholder:text-zinc-400 focus:outline-none focus:border-black transition-all"
                        autoFocus
                      />
                      <p className="text-xs text-zinc-400 font-medium pt-1">
                        You can change this later.
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-6">
                    <button
                      onClick={() => setStep(3)}
                      className="w-full bg-black hover:bg-zinc-800 text-white font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-xs"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5 text-white stroke-[2.5]" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========================================= */}
              {/* SCREEN 3: WHERE DID YOU HEAR ABOUT US? */}
              {/* ========================================= */}
              {step === 3 && (
                <motion.div
                  key="screen3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Header Nav */}
                  <div className="flex items-center justify-between pt-1 pb-4">
                    <button
                      onClick={() => setStep(2)}
                      className="p-2 -ml-2 rounded-full text-black hover:bg-zinc-100 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <ProgressIndicator activeStep={2} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-4 pt-2">
                    <div className="space-y-1">
                      <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight leading-tight">
                        Where did you<br />hear about us?
                      </h1>
                      <p className="text-xs text-zinc-500 font-normal">
                        This helps us improve and grow the ThreadZW community.
                      </p>
                    </div>

                    {/* Radio Options List */}
                    <div className="space-y-2 pt-1 max-h-[340px] overflow-y-auto pr-1">
                      {REFERRAL_OPTIONS.map((opt) => {
                        const isSelected = referrer === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setReferrer(opt.id)}
                            className={`w-full p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-zinc-50 border-black'
                                : 'bg-white border-zinc-200 hover:border-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {opt.icon}
                              <span className="text-sm font-semibold text-black">{opt.label}</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-black bg-black text-white' : 'border-zinc-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-4">
                    <button
                      onClick={() => setStep(4)}
                      className="w-full bg-black hover:bg-zinc-800 text-white font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-xs"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5 text-white stroke-[2.5]" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========================================= */}
              {/* SCREEN 4: SIGN UP */}
              {/* ========================================= */}
              {step === 4 && (
                <motion.div
                  key="screen4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Header Nav */}
                  <div className="flex items-center justify-between pt-1 pb-4">
                    <button
                      onClick={() => setStep(3)}
                      className="p-2 -ml-2 rounded-full text-black hover:bg-zinc-100 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <ProgressIndicator activeStep={3} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-6 pt-2">
                    <div className="space-y-2">
                      <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight leading-tight">
                        Let’s create<br />your account
                      </h1>
                      <p className="text-xs sm:text-sm text-zinc-500 font-normal">
                        Create an account to manage your store and grow your brand.
                      </p>
                    </div>

                    {/* Direct Sign Up Form (Email, Phone with +263 preset, Password) */}
                    <form onSubmit={handleSignUp} className="space-y-3 pt-1">
                      {authError && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium">
                          {authError}
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-bold text-zinc-600 mb-1 block">Email address</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-3 text-sm text-black focus:outline-none focus:border-black font-medium"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-600 mb-1 block">WhatsApp phone number</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={handlePhoneChange}
                          placeholder="+263 77 123 4567"
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-3 text-sm text-black focus:outline-none focus:border-black font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-600 mb-1 block">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white border border-zinc-200 rounded-xl pl-3.5 pr-10 py-3 text-sm text-black focus:outline-none focus:border-black"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black cursor-pointer"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black hover:bg-zinc-800 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-2 shadow-sm"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span>Create Account & Start Trial</span>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Terms footer */}
                  <div className="pt-4 text-center">
                    <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                      By continuing, you agree to our<br />
                      <span className="font-bold text-zinc-700 underline cursor-pointer">Terms of Service</span> and{' '}
                      <span className="font-bold text-zinc-700 underline cursor-pointer">Privacy Policy</span>.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ========================================= */}
              {/* SCREEN 14: SIGNUP SUCCESS */}
              {/* ========================================= */}
              {step === 14 && (
                <motion.div
                  key="screenSignupSuccess"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 flex flex-col justify-between -mx-6 sm:-mx-8 -my-6 sm:-my-8"
                >
                  <SuccessScreen onContinue={() => setStep(5)} />
                </motion.div>
              )}

              {/* ========================================= */}
              {/* SCREEN 5: UPLOAD YOUR BRAND (LOGO & BANNER) */}
              {/* ========================================= */}
              {step === 5 && (
                <motion.div
                  key="screen5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Header Nav */}
                  <div className="flex items-center justify-between pt-1 pb-3">
                    <button
                      onClick={() => setStep(4)}
                      className="p-2 -ml-2 rounded-full text-black hover:bg-zinc-100 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <ProgressIndicator activeStep={2} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-4 pt-1">
                    <div className="space-y-1">
                      <h1 className="text-3xl font-extrabold text-black tracking-tight leading-tight">
                        Make it yours.
                      </h1>
                      <p className="text-xs text-zinc-500 font-medium">
                        Add your logo and banner so your storefront feels like your brand.
                      </p>
                    </div>

                    {/* Editable Shop Name */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                        Shop name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-2xl pl-4 pr-10 py-3 text-sm font-semibold text-black focus:outline-none focus:border-black transition-all"
                        />
                        <Pencil className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Logo Section */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                        Shop logo
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-24 rounded-2xl bg-black border border-zinc-200 overflow-hidden relative flex items-center justify-center shadow-xs shrink-0">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Shop Logo" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-white text-center p-2 font-black text-xs">
                              {shopName || 'LOGO'}
                            </div>
                          )}
                        </div>

                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/*"
                          onChange={handleLogoSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="flex-1 h-24 border-2 border-dashed border-zinc-200 hover:border-black rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-zinc-50/50 hover:bg-zinc-50"
                        >
                          <Upload className="w-5 h-5 text-zinc-500 mb-1" />
                          <span className="text-xs font-bold text-black block">Upload logo</span>
                          <span className="text-[10px] text-zinc-400 font-medium">Recommended 512x512</span>
                        </label>
                      </div>
                    </div>

                    {/* Banner Section */}
                    <div className="space-y-1 pt-1">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                        Shop banner
                      </label>
                      <input
                        type="file"
                        id="banner-upload"
                        accept="image/*"
                        onChange={handleBannerSelect}
                        className="hidden"
                      />
                      <div className="relative w-full h-28 rounded-2xl bg-zinc-900 border border-zinc-200 overflow-hidden group">
                        {bannerPreview ? (
                          <img src={bannerPreview} alt="Shop Banner" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white font-bold text-xs">
                            {shopName ? shopName.toUpperCase() : 'YOUR STORE BANNER'}
                          </div>
                        )}
                        <label
                          htmlFor="banner-upload"
                          className="absolute inset-0 bg-black/40 hover:bg-black/60 transition-all flex items-center justify-center gap-2 cursor-pointer text-white text-xs font-bold"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{bannerPreview ? 'Replace Banner' : 'Upload Banner'}</span>
                        </label>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-medium pt-0.5">Recommended 1500x500</p>
                    </div>
                  </div>

                  {/* Primary Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleSaveBrand}
                      disabled={loading}
                      className="w-full bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <span className="text-black font-extrabold">Continue</span>
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-black" />
                      ) : (
                        <ArrowRight className="w-5 h-5 text-black stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========================================= */}
              {/* SCREEN 6: ADD BIO */}
              {/* ========================================= */}
              {step === 6 && (
                <motion.div
                  key="screen6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Header Nav */}
                  <div className="flex items-center justify-between pt-1 pb-3">
                    <button
                      onClick={() => setStep(5)}
                      className="p-2 -ml-2 rounded-full text-black hover:bg-zinc-100 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <ProgressIndicator activeStep={2} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-4 pt-1">
                    <div className="space-y-1">
                      <h1 className="text-3xl font-extrabold text-black tracking-tight leading-tight">
                        Tell people about<br />your brand.
                      </h1>
                      <p className="text-xs text-zinc-500 font-medium">
                        Choose a description or write your own.
                      </p>
                    </div>

                    {/* Bio Presets Grid (3x3 matching design mockups) */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {BIO_PRESETS.map((preset) => {
                        const isSelected = selectedBioCategory === preset.id;
                        const IconComp = preset.icon;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setSelectedBioCategory(preset.id);
                              setBioText(preset.text);
                            }}
                            className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer h-20 ${
                              isSelected
                                ? 'bg-white border-[#C6FF00] shadow-sm ring-2 ring-[#C6FF00]/40'
                                : 'bg-white border-zinc-200 hover:border-zinc-300'
                            }`}
                          >
                            <IconComp className={`w-5 h-5 mb-1 ${isSelected ? 'text-black' : 'text-zinc-600'}`} />
                            <span className="text-[11px] font-bold text-black leading-tight line-clamp-2">
                              {preset.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Editable Bio Textarea */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                        Bio
                      </label>
                      <div className="relative">
                        <textarea
                          rows={3}
                          value={bioText}
                          onChange={(e) => setBioText(e.target.value)}
                          placeholder="Write a custom description for your storefront..."
                          className="w-full bg-white border border-zinc-200 rounded-2xl p-3.5 text-xs font-medium text-black placeholder:text-zinc-400 focus:outline-none focus:border-black transition-all resize-none"
                          maxLength={160}
                        />
                        <div className="text-[10px] text-zinc-400 font-mono text-right pt-0.5">
                          {bioText.length}/160
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Primary Button */}
                  <div className="pt-3">
                    <button
                      onClick={handleSaveBio}
                      disabled={loading}
                      className="w-full bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <span className="text-black font-extrabold">Continue</span>
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-black" />
                      ) : (
                        <ArrowRight className="w-5 h-5 text-black stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========================================= */}
              {/* SCREEN 7: ADD SHOP DIRECTIONS */}
              {/* ========================================= */}
              {step === 7 && (
                <motion.div
                  key="screen7"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Header Nav */}
                  <div className="flex items-center justify-between pt-1 pb-3">
                    <button
                      onClick={() => setStep(6)}
                      className="p-2 -ml-2 rounded-full text-black hover:bg-zinc-100 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <ProgressIndicator activeStep={3} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-4 pt-1">
                    <div className="space-y-1">
                      <h1 className="text-3xl font-extrabold text-black tracking-tight leading-tight">
                        Where can customers<br />find you?
                      </h1>
                      <p className="text-xs text-zinc-500 font-medium">
                        Add simple directions so customers know where to find your shop.
                      </p>
                    </div>

                    {/* Shop Address / Area Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                        Shop address
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={shopAddress}
                          onChange={(e) => setShopAddress(e.target.value)}
                          placeholder="City, Area or Suburb (e.g. Fort Street Mall, Bulawayo)"
                          className="w-full bg-white border border-zinc-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-black focus:outline-none focus:border-black transition-all"
                        />
                      </div>
                    </div>

                    {/* Directions Textarea */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                        Directions
                      </label>
                      <div className="relative">
                        <textarea
                          rows={3}
                          value={shopDirections}
                          onChange={(e) => setShopDirections(e.target.value)}
                          placeholder="e.g. Head towards Fort Street Mall main entrance. We are on the First Floor, Shop F12. Look for the NARDO DRIP sign."
                          className="w-full bg-white border border-zinc-200 rounded-2xl p-3 text-xs font-medium text-black placeholder:text-zinc-400 focus:outline-none focus:border-black transition-all resize-none"
                          maxLength={200}
                        />
                        <div className="text-[10px] text-zinc-400 font-mono text-right pt-0.5">
                          {shopDirections.length}/200
                        </div>
                      </div>
                    </div>

                    {/* Green Highlighter Notice Box */}
                    <div className="bg-[#C6FF00] border-2 border-black/20 p-3.5 rounded-2xl space-y-1.5 shadow-xs text-black">
                      <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-black shrink-0" />
                        <span>Directions Guidance</span>
                      </div>
                      <p className="text-xs font-bold leading-snug">
                        Note that these are the directions on how customers exactly reach your shop.
                      </p>
                      <div className="bg-black/10 border border-black/10 p-2.5 rounded-xl text-[11px] font-medium leading-normal text-black">
                        <span className="font-extrabold">Example:</span> Head towards Fort Street Mall main entrance. We are on the First Floor, Shop F12. Look for the NARDO DRIP sign.
                      </div>
                    </div>

                    {/* WhatsApp Phone Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                        WhatsApp number (for customers)
                      </label>
                      <div className="relative">
                        <WhatsAppIcon />
                        <input
                          type="tel"
                          value={whatsappPhone}
                          onChange={(e) => setWhatsappPhone(e.target.value)}
                          placeholder="+263 77 123 4567"
                          className="w-full bg-white border border-zinc-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-black focus:outline-none focus:border-black transition-all"
                        />
                      </div>
                    </div>

                    {/* Preview box for customers */}
                    <div className="p-3 bg-zinc-50/80 rounded-2xl border border-zinc-200/80 space-y-1">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Preview for your customers
                      </div>
                      <div className="flex items-start gap-2 pt-0.5">
                        <Store className="w-4 h-4 text-black shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-black">{shopName || 'Your Shop'}</div>
                          <div className="text-[11px] font-medium text-zinc-600">{shopAddress || 'No address specified'}</div>
                          <div className="text-[10px] text-zinc-500 font-normal leading-normal pt-0.5">
                            {shopDirections || 'Add step-by-step directions so customers can easily find your store or pickup location.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Primary Button */}
                  <div className="pt-3">
                    <button
                      onClick={handleSaveDirections}
                      disabled={loading}
                      className="w-full bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <span className="text-black font-extrabold">Continue</span>
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-black" />
                      ) : (
                        <ArrowRight className="w-5 h-5 text-black stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========================================= */}
              {/* SCREEN 8: ADD YOUR FIRST PRODUCT */}
              {/* ========================================= */}
              {step === 8 && (
                <motion.div
                  key="screen8"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Header Nav */}
                  <div className="flex items-center justify-between pt-1 pb-3">
                    <button
                      onClick={() => setStep(7)}
                      className="p-2 -ml-2 rounded-full text-black hover:bg-zinc-100 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <ProgressIndicator activeStep={4} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-3 pt-1 max-h-[480px] overflow-y-auto pr-1">
                    <div className="space-y-1">
                      <h1 className="text-3xl font-extrabold text-black tracking-tight leading-tight">
                        Add your first product
                      </h1>
                      <p className="text-xs text-zinc-500 font-medium">
                        Let's add a product to your shop. You can add more later.
                      </p>
                    </div>

                    {/* Product Images Area */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                        Product images
                      </label>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {productImages.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className="relative w-16 h-16 rounded-xl border border-zinc-200 overflow-hidden bg-zinc-100 shrink-0"
                          >
                            <img src={imgUrl} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setProductImages(productImages.filter((_, i) => i !== idx));
                              }}
                              className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 cursor-pointer hover:bg-black"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}

                        <input
                          type="file"
                          id="product-images-upload"
                          accept="image/*"
                          multiple
                          onChange={handleProductImageSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor="product-images-upload"
                          className="w-16 h-16 rounded-xl border-2 border-dashed border-zinc-200 hover:border-black flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-zinc-50/50 hover:bg-zinc-50 shrink-0"
                        >
                          <Plus className="w-4 h-4 text-zinc-400 mb-0.5" />
                          <span className="text-[9px] font-bold text-zinc-600">Add more</span>
                        </label>
                      </div>
                    </div>

                    {/* Product Name */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                        Product name
                      </label>
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g. Heavyweight Hoodie - Black"
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-black focus:outline-none focus:border-black transition-all"
                      />
                    </div>

                    {/* Price and Stock row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                          Price (USD)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">$</span>
                          <input
                            type="text"
                            value={productPrice}
                            onChange={(e) => setProductPrice(e.target.value)}
                            placeholder="35.00"
                            className="w-full bg-white border border-zinc-200 rounded-xl pl-7 pr-3 py-2.5 text-xs font-semibold text-black focus:outline-none focus:border-black transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                          Stock
                        </label>
                        <input
                          type="number"
                          value={productStock}
                          onChange={(e) => setProductStock(e.target.value)}
                          placeholder="10"
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-black focus:outline-none focus:border-black transition-all"
                        />
                      </div>
                    </div>

                    {/* Category Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                        Category
                      </label>
                      <div className="relative">
                        <select
                          value={productCategory}
                          onChange={(e) => setProductCategory(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-black focus:outline-none focus:border-black appearance-none cursor-pointer"
                        >
                          <option value="">Select category...</option>
                          <option value="Hoodies">Hoodies</option>
                          <option value="T-Shirts">T-Shirts</option>
                          <option value="Sneakers">Sneakers</option>
                          <option value="Pants">Pants</option>
                          <option value="Jackets">Jackets</option>
                          <option value="Accessories">Accessories</option>
                          <option value="Other">Other</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Sizes Pills */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                        Sizes
                      </label>
                      <div className="flex items-center gap-1.5">
                        {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => {
                          const isSelected = productSizes.includes(sz);
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => toggleSize(sz)}
                              className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#C6FF00] border-black text-black shadow-xs'
                                  : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Short Description */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                        Short description
                      </label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={productDescription}
                          onChange={(e) => setProductDescription(e.target.value)}
                          placeholder="Premium heavyweight hoodie. Limited drop."
                          className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 text-xs font-medium text-black placeholder:text-zinc-400 focus:outline-none focus:border-black transition-all resize-none"
                          maxLength={120}
                        />
                        <div className="text-[10px] text-zinc-400 font-mono text-right pt-0.5">
                          {productDescription.length}/120
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Primary Button */}
                  <div className="pt-3 space-y-2">
                    <button
                      onClick={() => handleSaveFirstProduct(false)}
                      disabled={loading}
                      className="w-full bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <span className="text-black font-extrabold">Add Product</span>
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-black" />
                      ) : (
                        <ArrowRight className="w-5 h-5 text-black stroke-[2.5]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveFirstProduct(true)}
                      className="w-full text-center text-xs font-bold text-zinc-400 hover:text-black py-1 transition-colors cursor-pointer"
                    >
                      Skip for now
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========================================= */}
              {/* SCREEN 9: PREVIEW STOREFRONT */}
              {/* ========================================= */}
              {step === 9 && (
                <motion.div
                  key="screen9"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Header Nav */}
                  <div className="flex items-center justify-between pt-1 pb-3">
                    <button
                      onClick={() => setStep(6)}
                      className="p-2 -ml-2 rounded-full text-black hover:bg-zinc-100 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <ProgressIndicator activeStep={5} totalSteps={5} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-3 pt-1">
                    <div className="space-y-1">
                      <h1 className="text-3xl font-extrabold text-black tracking-tight leading-tight">
                        Preview your storefront
                      </h1>
                      <p className="text-xs text-zinc-500 font-medium">
                        This is how customers will see your shop.
                      </p>
                    </div>

                    {/* Storefront Mockup Frame */}
                    <div className="bg-white border-2 border-zinc-900 rounded-3xl shadow-lg relative overflow-hidden flex flex-col">
                      {/* Top Bar: POWERED BY THREADZW 💚 */}
                      <div className="bg-[#C6FF00] text-black text-[10px] font-black uppercase tracking-wider py-1.5 px-3 text-center flex items-center justify-center gap-1">
                        <span>POWERED BY THREADZW 💚</span>
                      </div>

                      {/* Header row */}
                      <div className="bg-white border-b border-zinc-200 px-3.5 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full border border-zinc-200 overflow-hidden shrink-0 bg-black text-white flex items-center justify-center font-black text-xs">
                            {logoPreview ? (
                              <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <span>{shopName ? shopName.slice(0, 2).toUpperCase() : 'TZ'}</span>
                            )}
                          </div>
                          <span className="text-xs sm:text-sm font-black text-black">
                            {shopName || 'Your Shop'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-black">
                          <Share2 size={15} className="cursor-pointer" />
                          <Search size={15} className="cursor-pointer" />
                          <ShoppingBag size={15} className="cursor-pointer" />
                        </div>
                      </div>

                      {/* Banner Image + Overlapping Circular Logo */}
                      <div className="relative">
                        <div className="h-32 sm:h-36 w-full overflow-hidden bg-zinc-900">
                          {bannerPreview ? (
                            <img
                              src={bannerPreview}
                              alt="Shop Banner"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center text-white/50 font-black text-xs uppercase tracking-widest p-4 text-center">
                              {shopName ? `${shopName.toUpperCase()} STORE BANNER` : 'STORE BANNER'}
                            </div>
                          )}
                        </div>
                        <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-4 border-white shadow-md bg-black text-white font-black text-xl flex items-center justify-center overflow-hidden -mt-10 relative z-10 mx-auto">
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Shop Logo"
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span>{shopName ? shopName.slice(0, 2).toUpperCase() : 'TZ'}</span>
                          )}
                        </div>
                      </div>

                      {/* Shop Info Details */}
                      <div className="space-y-1.5 pt-2 px-4 text-center">
                        <h2 className="text-lg font-black text-black">
                          {shopName || 'Your Shop Name'}
                        </h2>

                        <div className="inline-flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-[#25D366] uppercase tracking-wide">
                          <Sparkles size={12} className="text-[#25D366]" />
                          <span>ZIMBABWE STORE LINK</span>
                        </div>

                        <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto pt-0.5">
                          {bioText || 'Your storefront bio will appear here.'}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-3 px-4 pb-2">
                        <button
                          type="button"
                          className="w-full bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-black text-xs uppercase py-3 px-4 rounded-full flex items-center justify-center gap-2 shadow-xs cursor-pointer tracking-wider border border-black/10"
                        >
                          <span>BROWSE CATALOG</span>
                          <ArrowRight size={14} className="stroke-[2.5]" />
                        </button>

                        <button
                          type="button"
                          className="w-full bg-white hover:bg-zinc-50 border border-zinc-200 text-black font-extrabold text-xs uppercase py-3 px-4 rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-xs tracking-wider"
                        >
                          <span>MESSAGE US</span>
                        </button>

                        <button
                          type="button"
                          className="w-full bg-white hover:bg-zinc-50 border border-zinc-200 text-black font-extrabold text-xs uppercase py-3 px-4 rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-xs tracking-wider"
                        >
                          <Share2 size={13} />
                          <span>SHARE SHOP LINK</span>
                        </button>
                      </div>

                      {/* Bottom Floating Nav Bar */}
                      <div className="bg-white border border-zinc-900 rounded-2xl p-2 shadow-md flex justify-around items-center text-[10px] font-bold text-zinc-600 mt-2 mx-3 mb-3">
                        <div className="flex flex-col items-center gap-0.5 text-black">
                          <Home size={16} />
                          <span>Home</span>
                          <span className="w-1 h-1 bg-[#25D366] rounded-full mt-0.5" />
                        </div>
                        <div className="flex flex-col items-center gap-0.5 text-zinc-500">
                          <Grid size={16} />
                          <span>Shop</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 text-zinc-500">
                          <ShoppingBag size={16} />
                          <span>Cart</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 text-zinc-500">
                          <Heart size={16} />
                          <span>Wishlist</span>
                        </div>
                      </div>
                    </div>

                    {/* Editing notice callout */}
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center gap-2 text-xs font-medium text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>You can edit everything anytime before your shop goes live.</span>
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <div className="pt-3">
                    <button
                      onClick={() => setStep(10)}
                      className="w-full bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-xs"
                    >
                      <span className="text-black font-extrabold">Continue to Launch</span>
                      <ArrowRight className="w-5 h-5 text-black stroke-[2.5]" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========================================= */}
              {/* SCREEN 10: LAUNCH PAYWALL */}
              {/* ========================================= */}
              {step === 10 && (
                <motion.div
                  key="screen10"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Header Nav */}
                  <div className="flex items-center justify-between pt-1 pb-3">
                    <button
                      onClick={() => setStep(9)}
                      className="p-2 -ml-2 rounded-full text-black hover:bg-zinc-100 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <ProgressIndicator activeStep={5} totalSteps={5} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-4 pt-1">
                    <div className="space-y-1">
                      <h1 className="text-3xl font-extrabold text-black tracking-tight leading-tight">
                        Your storefront is ready!
                      </h1>
                      <p className="text-xs text-zinc-500 font-medium">
                        Everything looks good. Launch your shop and start getting customers.
                      </p>
                    </div>

                    {/* Pricing Card */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4 text-center relative overflow-hidden">
                      {/* Pill Badge */}
                      <div className="inline-block bg-lime-100 text-lime-900 border border-lime-200 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        ONE TIME PAYMENT
                      </div>

                      {/* Price */}
                      <div className="space-y-0.5">
                        <div className="text-5xl font-black text-black tracking-tight">$20</div>
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Lifetime Storefront Activation</div>
                      </div>

                      <div className="border-t border-zinc-100 pt-3 space-y-2.5 text-left">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-lime-100 text-lime-900 flex items-center justify-center shrink-0 mt-0.5">
                            <Infinity className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-black">Pay once, own forever</div>
                            <div className="text-[11px] text-zinc-500">No monthly fees. Ever.</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-lime-100 text-lime-900 flex items-center justify-center shrink-0 mt-0.5">
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-black">Your shop, your brand</div>
                            <div className="text-[11px] text-zinc-500">Keep your link and customers.</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-lime-100 text-lime-900 flex items-center justify-center shrink-0 mt-0.5">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-black">Built for Zimbabwe</div>
                            <div className="text-[11px] text-zinc-500">Local support. Local payment.</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guarantee badge */}
                    <div className="bg-lime-50/80 border border-lime-200/80 rounded-2xl p-2.5 flex items-center justify-center gap-2 text-xs font-bold text-lime-900 text-center">
                      <Check className="w-4 h-4 text-lime-700 stroke-[3]" />
                      <span>30-day money back guarantee.</span>
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <div className="pt-3 space-y-2 text-center">
                    <button
                      onClick={() => setStep(11)}
                      className="w-full bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-xs"
                    >
                      <span className="text-black font-extrabold">Launch My Store – $20</span>
                      <ArrowRight className="w-5 h-5 text-black stroke-[2.5]" />
                    </button>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      Secure payment powered by Nardo Pay
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ========================================= */}
              {/* SCREEN 11: NARDO PAY PAYMENT */}
              {/* ========================================= */}
              {step === 11 && (
                <motion.div
                  key="screen11"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Header Nav */}
                  <div className="flex items-center justify-between pt-1 pb-3">
                    <button
                      onClick={() => setStep(10)}
                      className="p-2 -ml-2 rounded-full text-black hover:bg-zinc-100 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <ProgressIndicator activeStep={5} totalSteps={5} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-4 pt-1">
                    <div className="space-y-1">
                      <h1 className="text-3xl font-extrabold text-black tracking-tight leading-tight">
                        Complete your payment
                      </h1>
                      <p className="text-xs text-zinc-500 font-medium">
                        You're moments away from launching {shopName || 'your store'}.
                      </p>
                    </div>

                    {/* Order Summary Box */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-4 space-y-3 shadow-xs">
                      <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                        Order summary
                      </div>
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center font-black text-xs shrink-0 overflow-hidden">
                            {logoPreview ? (
                              <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              (shopName || 'SD').substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-black">ThreadZW Lifetime Plan</div>
                            <div className="text-[10px] text-zinc-500 font-normal">
                              Lifetime access to your shop, no monthly fees.
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-extrabold text-black">$20.00</div>
                      </div>

                      <div className="border-t border-zinc-100 pt-2 flex items-center justify-between text-xs font-black">
                        <span className="text-zinc-700">Total</span>
                        <span className="text-black text-sm">$20.00</span>
                      </div>
                    </div>

                    {/* Payment Method Box */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-4 space-y-3 shadow-xs">
                      <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                        Pay with Nardo Pay
                      </div>

                      <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center justify-between">
                        <NardoPayIcon />
                        <span className="text-[10px] font-medium text-zinc-500">Pay securely via EcoCash, ZIPIT or Card.</span>
                      </div>

                      <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-black hover:bg-zinc-800 text-white font-extrabold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-xs"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <span>Pay $20 with Nardo Pay</span>
                        )}
                      </button>

                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 font-medium pt-0.5">
                        <Lock size={11} className="text-zinc-400" />
                        <span>Secure. Fast. Trusted.</span>
                      </div>
                    </div>
                  </div>

                  {/* Subtext */}
                  <div className="pt-2 text-center">
                    <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                      You will be redirected to Nardo Pay to complete your payment securely.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ========================================= */}
              {/* SCREEN 12: PAYMENT SUCCESS & LOGIN SLOT */}
              {/* ========================================= */}
              {step === 12 && (
                <motion.div
                  key="screen12"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Header Nav */}
                  <div className="flex items-center justify-between pt-1 pb-2">
                    <div className="w-5" />
                    <ProgressIndicator activeStep={5} totalSteps={5} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-3.5 pt-1">
                    {/* Celebration checkmark */}
                    <div className="flex flex-col items-center justify-center text-center space-y-1.5 pt-1">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-[#C6FF00] flex items-center justify-center shadow-md">
                          <Check className="w-8 h-8 text-black stroke-[3]" />
                        </div>
                        <Sparkles className="w-5 h-5 text-[#C6FF00] absolute -top-1 -right-1" />
                      </div>
                      <h1 className="text-2xl font-extrabold text-black tracking-tight">
                        Payment Successful!
                      </h1>
                      <p className="text-xs font-bold text-zinc-500">
                        Your storefront is ready. Set your login credentials to activate your shop.
                      </p>
                    </div>

                    {/* Shop Confirmation Card */}
                    <div className="bg-lime-50 border border-lime-200 rounded-2xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            (shopName || 'SD').substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-black text-black">{shopName || 'Your Shop'}</div>
                          <div className="text-[10px] text-lime-900 font-semibold">✓ Payment Confirmed ($20 Lifetime)</div>
                        </div>
                      </div>
                      <span className="bg-[#C6FF00] text-black text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-black/10">
                        Ready
                      </span>
                    </div>

                    {/* Login Details Slot Form */}
                    <form onSubmit={handleActivateAccount} className="space-y-3 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
                      <div className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-1.5">
                        <Lock size={13} className="text-black" />
                        <span>Create Login Credentials</span>
                      </div>

                      {/* Email Address */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-700 block">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.email@gmail.com"
                            className="w-full bg-white border border-zinc-200 focus:border-black rounded-xl py-2.5 px-3 pl-9 text-xs font-semibold text-black placeholder:text-zinc-400 outline-none transition-all"
                          />
                          <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-zinc-700 block">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min. 6 characters"
                            className="w-full bg-white border border-zinc-200 focus:border-black rounded-xl py-2.5 px-3 pl-9 pr-9 text-xs font-semibold text-black placeholder:text-zinc-400 outline-none transition-all"
                          />
                          <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-zinc-400 hover:text-black transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      {authError && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
                          {authError}
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Primary CTA */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={handleActivateAccount}
                      disabled={loading}
                      className="w-full bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-extrabold text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-50 border border-black/10"
                    >
                      <span className="text-black font-extrabold">LOG IN & ACTIVATE SHOP</span>
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-black" />
                      ) : (
                        <ArrowRight className="w-5 h-5 text-black stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========================================= */}
              {/* SCREEN 13: SHOP ACTIVATED SUCCESS PAGE */}
              {/* ========================================= */}
              {step === 13 && (
                <motion.div
                  key="screen13"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  {/* Top Header Nav */}
                  <div className="flex items-center justify-between pt-1 pb-2">
                    <div className="w-5" />
                    <ProgressIndicator activeStep={5} totalSteps={5} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-4 pt-1">
                    {/* Celebration Header */}
                    <div className="flex flex-col items-center justify-center text-center space-y-2 pt-2">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-[#C6FF00] flex items-center justify-center shadow-lg border-2 border-black/10">
                          <Check className="w-10 h-10 text-black stroke-[3]" />
                        </div>
                        <Sparkles className="w-6 h-6 text-[#C6FF00] absolute -top-1 -right-1" />
                      </div>
                      <h1 className="text-2xl font-black text-black tracking-tight pt-1">
                        Congratulations!
                      </h1>
                      <div className="bg-[#C6FF00] text-black text-xs font-black uppercase px-3 py-1 rounded-full tracking-wider border border-black/10 inline-block">
                        YOUR SHOP HAS BEEN ACTIVATED 🎉
                      </div>
                      <p className="text-xs text-zinc-500 font-medium max-w-xs leading-relaxed pt-1">
                        Your shop <span className="font-extrabold text-black">"{shopName || 'Your Shop'}"</span> is now live on ThreadZW and ready to start taking orders!
                      </p>
                    </div>

                    {/* Shop Link Box with Copy Button */}
                    <div className="bg-white border-2 border-zinc-900 rounded-3xl p-4 space-y-3 shadow-md">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-black flex items-center justify-center shrink-0">
                          <Link className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-black uppercase tracking-wider">Your Shop Link</div>
                          <div className="text-[10px] text-zinc-500 font-medium">Share this link with your customers</div>
                        </div>
                      </div>

                      <div className="bg-zinc-100 p-2.5 rounded-2xl border border-zinc-200 flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-black text-black truncate pl-1">
                          threadzw.co/shop/{(shopName || 'shop').toLowerCase().replace(/[^a-z0-9_-]/g, '-')}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const slug = (shopName || 'shop').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
                            navigator.clipboard.writeText(`https://threadzw.co/shop/${slug}`);
                            toast.success('🎉 Shop link copied to clipboard!');
                          }}
                          className="bg-black hover:bg-zinc-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                        >
                          <Copy size={13} />
                          <span>Copy Link</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Features List */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 space-y-2 text-xs">
                      <div className="flex items-center gap-2 font-bold text-black">
                        <CheckCircle2 size={14} className="text-[#25D366]" />
                        <span>WhatsApp direct ordering enabled</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold text-black">
                        <CheckCircle2 size={14} className="text-[#25D366]" />
                        <span>Custom storefront banner & logo online</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold text-black">
                        <CheckCircle2 size={14} className="text-[#25D366]" />
                        <span>Lifetime active subscription</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA Buttons */}
                  <div className="pt-3 space-y-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try { await refreshShop(); } catch (e) {}
                        localStorage.setItem('threadzw_logged_in', 'true');
                        navigate('/dashboard', { replace: true });
                        window.location.href = '/dashboard';
                      }}
                      className="w-full bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-black text-base py-4 px-6 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-md border border-black/10 uppercase tracking-wider"
                    >
                      <span>GO TO DASHBOARD</span>
                      <ArrowRight className="w-5 h-5 text-black stroke-[2.5]" />
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

        </div>
      )}

      {/* MODE 2: OVERVIEW OF ALL ONBOARDING SCREENS SIDE BY SIDE */}
      {viewMode === 'overview' && (
        <div className="w-full max-w-7xl px-4 py-8 mx-auto flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start justify-center">
            
            {/* CARD 1: WELCOME */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-black text-black">
                    THREAD<span className="text-[#C6FF00]">ZW</span>
                  </h2>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">
                    SELL MORE. STRESS LESS.
                  </p>
                </div>

                <div className="space-y-2 py-4">
                  <h1 className="text-3xl font-extrabold text-black tracking-tight leading-[1.08]">
                    Launch your<br />
                    clothing store<br />
                    in under<br />
                    <span className="text-[#C6FF00]">60 seconds.</span>
                  </h1>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    No coding. No website builders.<br />
                    Just your brand.
                  </p>
                </div>

                <div className="relative w-full h-36 bg-zinc-50 rounded-2xl p-2 border border-zinc-100 flex items-center justify-center overflow-hidden">
                  <img
                    src="https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/save%20it%20for%20later.jfif"
                    alt="Clothing Flatlay"
                    className="w-20 h-28 object-cover rounded-xl shadow-lg -rotate-6 absolute left-2 top-2 border-2 border-white z-10"
                  />
                  <img
                    src="https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/download%20(2).jfif"
                    alt="Cap"
                    className="w-18 h-18 object-cover rounded-xl shadow-md rotate-12 absolute right-2 top-1 border-2 border-white z-20"
                  />
                  <img
                    src="https://zuashdquiorcwvyvqucm.supabase.co/storage/v1/object/public/landing%20page%20background/Puma%20Men's%20Trainers%20(1).jfif"
                    alt="Trainers & Drip"
                    className="w-20 h-24 object-cover rounded-xl shadow-lg rotate-3 absolute right-4 bottom-1 border-2 border-white z-0"
                  />
                </div>

                <div className="pt-4 space-y-2 text-center">
                  <button
                    onClick={() => { setViewMode('flow'); setStep(1); }}
                    className="w-full bg-[#C6FF00] hover:bg-[#b5eb00] text-black font-extrabold text-sm py-3.5 px-5 rounded-2xl flex items-center justify-between cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Join thousands of brands in Zimbabwe
                  </p>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">1 Welcome</span>
              </div>
            </div>

            {/* CARD 2: ENTER SHOP NAME */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <ArrowLeft className="w-4 h-4 text-black" />
                  <ProgressIndicator activeStep={1} />
                </div>

                <div className="space-y-4 py-2">
                  <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight leading-tight">
                      What’s your<br />shop called?
                    </h1>
                    <p className="text-xs text-zinc-500 font-normal">
                      This will be the name of your store on ThreadZW.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[11px] font-bold text-black uppercase tracking-wider block">
                      Shop name
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={shopName}
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-3.5 py-3 text-xs font-semibold text-black"
                    />
                    <p className="text-[11px] text-zinc-400 font-medium">
                      You can change this later.
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => { setViewMode('flow'); setStep(2); }}
                    className="w-full bg-black text-white font-extrabold text-sm py-3.5 px-5 rounded-2xl flex items-center justify-between cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">2 Enter Shop Name</span>
              </div>
            </div>

            {/* CARD 3: WHERE DID YOU HEAR ABOUT US? */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <ArrowLeft className="w-4 h-4 text-black" />
                  <ProgressIndicator activeStep={2} />
                </div>

                <div className="space-y-3 py-1">
                  <div className="space-y-0.5">
                    <h1 className="text-2xl font-extrabold text-black tracking-tight leading-tight">
                      Where did you<br />hear about us?
                    </h1>
                    <p className="text-[11px] text-zinc-500 font-normal">
                      This helps us improve and grow the ThreadZW community.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {REFERRAL_OPTIONS.map((opt) => (
                      <div
                        key={opt.id}
                        className="w-full p-2.5 rounded-xl border border-zinc-200 flex items-center justify-between text-xs font-semibold"
                      >
                        <div className="flex items-center gap-2">
                          {opt.icon}
                          <span className="text-black">{opt.label}</span>
                        </div>
                        <div className="w-4 h-4 rounded-full border border-zinc-300" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => { setViewMode('flow'); setStep(3); }}
                    className="w-full bg-black text-white font-extrabold text-sm py-3.5 px-5 rounded-2xl flex items-center justify-between cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">3 Where did you hear about us?</span>
              </div>
            </div>

            {/* CARD 4: SIGN UP */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <ArrowLeft className="w-4 h-4 text-black" />
                  <ProgressIndicator activeStep={3} />
                </div>

                <div className="space-y-4 py-2">
                  <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight leading-tight">
                      Let’s create<br />your account
                    </h1>
                    <p className="text-xs text-zinc-500 font-normal">
                      Create an account to manage your store and grow your brand.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-600 mb-0.5 block">Email address</label>
                      <input
                        type="email"
                        readOnly
                        value="owner@plusher.co.zw"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-black"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-600 mb-0.5 block">WhatsApp phone number</label>
                      <input
                        type="tel"
                        readOnly
                        value="+263 77 123 4567"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-black"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-600 mb-0.5 block">Password</label>
                      <input
                        type="password"
                        readOnly
                        value="••••••••"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-black"
                      />
                    </div>

                    <button
                      onClick={() => { setViewMode('flow'); setStep(4); }}
                      className="w-full bg-black text-white font-extrabold text-xs py-3 px-4 rounded-xl flex items-center justify-center cursor-pointer mt-1"
                    >
                      <span>Create Account & Start Trial</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 text-center">
                  <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                    By continuing, you agree to our<br />
                    <span className="font-bold text-zinc-700 underline">Terms of Service</span> and{' '}
                    <span className="font-bold text-zinc-700 underline">Privacy Policy</span>.
                  </p>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">4 Sign Up</span>
              </div>
            </div>

            {/* CARD 5: UPLOAD BRAND */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <ArrowLeft className="w-4 h-4 text-black" />
                  <ProgressIndicator activeStep={2} />
                </div>

                <div className="space-y-3 py-2">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold text-black tracking-tight leading-tight">
                      Make it yours.
                    </h1>
                    <p className="text-xs text-zinc-500 font-normal">
                      Add logo and banner so your store feels like your brand.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-black uppercase block">Shop name</label>
                      <input
                        type="text"
                        readOnly
                        value={shopName}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-black"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-black uppercase block">Shop logo</label>
                      <div className="w-20 h-20 bg-black rounded-xl border flex items-center justify-center text-white font-bold text-xs">
                        LOGO
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => { setViewMode('flow'); setStep(5); }}
                    className="w-full bg-[#C6FF00] text-black font-extrabold text-xs py-3.5 px-4 rounded-xl flex items-center justify-between cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">5 Upload Brand</span>
              </div>
            </div>

            {/* CARD 6: ADD BIO */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <ArrowLeft className="w-4 h-4 text-black" />
                  <ProgressIndicator activeStep={2} />
                </div>

                <div className="space-y-3 py-2">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold text-black tracking-tight leading-tight">
                      Tell customers about your shop
                    </h1>
                    <p className="text-xs text-zinc-500 font-normal">
                      Choose a description or write your own.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {BIO_PRESETS.slice(0, 6).map((p) => (
                      <div key={p.id} className="p-1.5 bg-zinc-50 border rounded-xl text-center text-[10px] font-bold">
                        {p.title}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => { setViewMode('flow'); setStep(6); }}
                    className="w-full bg-[#C6FF00] text-black font-extrabold text-xs py-3.5 px-4 rounded-xl flex items-center justify-between cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">6 Add Bio</span>
              </div>
            </div>

            {/* CARD 7: SHOP DIRECTIONS */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <ArrowLeft className="w-4 h-4 text-black" />
                  <ProgressIndicator activeStep={3} />
                </div>

                <div className="space-y-3 py-2">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold text-black tracking-tight leading-tight">
                      Shop directions
                    </h1>
                    <p className="text-xs text-zinc-500 font-normal">
                      Add location and directions so customers can visit.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-50 border rounded-xl text-xs space-y-1">
                    <div className="font-bold">{shopAddress}</div>
                    <div className="text-zinc-500 text-[10px]">{shopDirections}</div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => { setViewMode('flow'); setStep(7); }}
                    className="w-full bg-[#C6FF00] text-black font-extrabold text-xs py-3.5 px-4 rounded-xl flex items-center justify-between cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">7 Shop Directions</span>
              </div>
            </div>

            {/* CARD 8: ADD FIRST PRODUCT */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <ArrowLeft className="w-4 h-4 text-black" />
                  <ProgressIndicator activeStep={4} />
                </div>

                <div className="space-y-3 py-2">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold text-black tracking-tight leading-tight">
                      Add first product
                    </h1>
                    <p className="text-xs text-zinc-500 font-normal">
                      Your storefront needs something to sell.
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs bg-zinc-50 border p-3 rounded-2xl">
                    <div className="font-bold text-black">{productName || 'No product added yet'}</div>
                    <div className="text-zinc-500 font-medium">{productPrice ? `$${productPrice}` : 'Price: $0.00'} {productStock ? `• Stock: ${productStock}` : '• Stock: 0'}</div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => { setViewMode('flow'); setStep(8); }}
                    className="w-full bg-[#C6FF00] text-black font-extrabold text-xs py-3.5 px-4 rounded-xl flex items-center justify-between cursor-pointer"
                  >
                    <span>Add Product</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">8 Add First Product</span>
              </div>
            </div>

            {/* CARD 9: PREVIEW STOREFRONT */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <ArrowLeft className="w-4 h-4 text-black" />
                  <ProgressIndicator activeStep={5} totalSteps={5} />
                </div>

                <div className="space-y-3 py-2">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold text-black tracking-tight leading-tight">
                      Preview storefront
                    </h1>
                    <p className="text-xs text-zinc-500 font-normal">
                      See how your customers will experience your shop.
                    </p>
                  </div>

                  <div className="bg-zinc-50 border p-3 rounded-2xl text-xs space-y-1">
                    <div className="font-bold text-black">{shopName || 'Your Shop'}</div>
                    <div className="text-[11px] text-[#25D366] font-bold">🇿🇼 ZIMBABWE STORE LINK</div>
                    <div className="text-[11px] text-zinc-500">{bioText || 'Storefront description'}</div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => { setViewMode('flow'); setStep(9); }}
                    className="w-full bg-[#C6FF00] text-black font-extrabold text-xs py-3.5 px-4 rounded-xl flex items-center justify-between cursor-pointer"
                  >
                    <span>Continue to Launch</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">9 Preview Storefront</span>
              </div>
            </div>

            {/* CARD 10: LAUNCH PAYWALL */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <ArrowLeft className="w-4 h-4 text-black" />
                  <ProgressIndicator activeStep={5} totalSteps={5} />
                </div>

                <div className="space-y-3 py-2">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold text-black tracking-tight leading-tight">
                      Launch Paywall
                    </h1>
                    <p className="text-xs text-zinc-500 font-normal">
                      $20 Lifetime Access plan for Zimbabwean merchants.
                    </p>
                  </div>

                  <div className="bg-lime-50 border border-lime-200 p-4 rounded-2xl text-center space-y-1">
                    <div className="text-3xl font-black text-black">$20</div>
                    <div className="text-[10px] font-bold text-lime-800 uppercase">Lifetime Storefront Activation</div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => { setViewMode('flow'); setStep(10); }}
                    className="w-full bg-[#C6FF00] text-black font-extrabold text-xs py-3.5 px-4 rounded-xl flex items-center justify-between cursor-pointer"
                  >
                    <span>Launch My Store – $20</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">10 Launch Paywall</span>
              </div>
            </div>

            {/* CARD 11: NARDO PAY */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <ArrowLeft className="w-4 h-4 text-black" />
                  <ProgressIndicator activeStep={5} totalSteps={5} />
                </div>

                <div className="space-y-3 py-2">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold text-black tracking-tight leading-tight">
                      Nardo Pay
                    </h1>
                    <p className="text-xs text-zinc-500 font-normal">
                      Complete $20 payment via EcoCash, ZIPIT or Card.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-50 border rounded-xl space-y-2">
                    <NardoPayIcon />
                    <div className="text-[10px] text-zinc-500">Secure payment processor</div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => { setViewMode('flow'); setStep(11); }}
                    className="w-full bg-black text-white font-extrabold text-xs py-3.5 px-4 rounded-xl flex items-center justify-between cursor-pointer"
                  >
                    <span>Pay $20 with Nardo Pay</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">11 Nardo Pay</span>
              </div>
            </div>

            {/* CARD 12: PAYMENT SUCCESS & LOGIN SLOT */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <div className="w-4" />
                  <ProgressIndicator activeStep={5} totalSteps={5} />
                </div>

                <div className="space-y-3 py-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#C6FF00] flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 text-black stroke-[3]" />
                  </div>

                  <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold text-black tracking-tight leading-tight">
                      Payment Successful!
                    </h1>
                    <p className="text-xs text-zinc-500 font-normal">
                      Enter email and password below to log in and activate your shop.
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => { setViewMode('flow'); setStep(12); }}
                    className="w-full bg-[#C6FF00] text-black font-extrabold text-xs py-3.5 px-4 rounded-xl flex items-center justify-between cursor-pointer"
                  >
                    <span>Log In & Activate Shop</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">12 Payment Success & Login</span>
              </div>
            </div>

            {/* CARD 13: SHOP ACTIVATED SUCCESS */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-6 shadow-md flex flex-col justify-between h-[620px] max-w-[340px] mx-auto w-full relative">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <div className="w-4" />
                  <ProgressIndicator activeStep={5} totalSteps={5} />
                </div>

                <div className="space-y-3 py-2 text-center">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold text-black tracking-tight leading-tight">
                      Congratulations!
                    </h1>
                    <p className="text-xs text-zinc-500 font-normal">
                      Your shop has been activated. Copy link and enter dashboard.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-50 border rounded-xl space-y-2 text-xs text-left">
                    <div className="font-bold text-black">{shopName || 'Your Shop'}</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">✓ Shop Active & Live</div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => { setViewMode('flow'); setStep(13); }}
                    className="w-full bg-[#C6FF00] text-black font-extrabold text-xs py-3.5 px-4 rounded-xl flex items-center justify-between cursor-pointer"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
              <div className="text-center pt-3 border-t border-zinc-100 mt-2">
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">13 Shop Activated</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
