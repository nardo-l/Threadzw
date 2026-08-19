import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, PageType } from '../../types';
import { fetchPublicPageBySlugOrId } from '../../services/publicPageService';
import { StorefrontPage } from '../../pages/StorefrontPage';
import { VehicleStorefrontView } from '../vehicles/VehicleStorefrontView';
import { ServicePageView } from './ServicePageView';
import { CreatorPageView } from './CreatorPageView';
import { ProfessionalPageView } from './ProfessionalPageView';
import { CommunityPageView } from './CommunityPageView';
import { AlertCircle, ArrowLeft, Store } from 'lucide-react';

export const BioPageView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorType, setErrorType] = useState<'not_found' | 'paused' | 'error' | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorType(null);

    fetchPublicPageBySlugOrId(slug).then(({ page: loadedPage, errorType: err }) => {
      if (!isMounted) return;

      if (err) {
        setErrorType(err);
        setPage(null);
      } else if (loadedPage) {
        setPage(loadedPage);
        setErrorType(null);
      } else {
        setErrorType('not_found');
        setPage(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-10 h-10 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-400 text-xs font-semibold tracking-wider uppercase">Loading ThreadZW Page...</p>
      </div>
    );
  }

  // 2. Paused / Inactive State
  if (errorType === 'paused') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm bg-[#141414] border border-zinc-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold">Page Currently Paused</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This page is temporarily inactive or undergoing maintenance. Please check back soon.
            </p>
          </div>
          <button
            onClick={() => navigate('/shops')}
            className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Explore Other Stores
          </button>
        </div>
      </div>
    );
  }

  // 3. Not Found / Error State
  if (errorType === 'not_found' || errorType === 'error' || !page) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm bg-[#141414] border border-zinc-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-400 border border-red-500/20">
            <Store className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold">Page Not Found</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The requested ThreadZW bio page or storefront does not exist or may have been updated.
            </p>
          </div>
          <button
            onClick={() => navigate('/shops')}
            className="w-full py-2.5 px-4 bg-lime-400 hover:bg-lime-300 text-black rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse ThreadZW Directory
          </button>
        </div>
      </div>
    );
  }

  // 4. Switch on normalized page_type
  const pageType: PageType = page.page_type || 'clothing';

  switch (pageType) {
    case 'service':
      return <ServicePageView page={page} />;
    case 'creator':
      return <CreatorPageView page={page} />;
    case 'professional':
      return <ProfessionalPageView page={page} />;
    case 'community':
      return <CommunityPageView page={page} />;
    case 'vehicles':
      return <VehicleStorefrontView shop={page} />;
    case 'clothing':
    case 'general':
    case 'storefront':
    default:
      return <StorefrontPage preloadedShop={page} />;
  }
};
