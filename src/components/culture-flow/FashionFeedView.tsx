import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, Plus, X, Camera, MapPin, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface Post {
  id: string;
  caption: string;
  images: string[];
  outfit_breakdown: any[];
  post_type: string;
  like_count: number;
  comment_count: number;
  save_count: number;
  town: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url: string;
    handle: string;
  };
}

export const FashionFeedView: React.FC = () => {
  const { session } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'forYou' | 'following' | 'trending'>('forYou');
  const [showUpload, setShowUpload] = useState(false);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [showComments, setShowComments] = useState<string | null>(null);

  const fetchFeed = async (tab = activeTab) => {
    setLoading(true);
    try {
      let query = supabase
        .from('fashion_posts')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url,
            handle
          )
        `)
        .eq('is_active', true);

      if (tab === 'following' && session?.user?.id) {
        const { data: follows } = await supabase.from('follows').select('shop_id').eq('follower_id', session.user.id);
        const followingIds = (follows || []).map(f => f.shop_id);
        if (followingIds.length) query = query.in('user_id', followingIds);
        else { setPosts([]); setLoading(false); return; }
      }

      if (tab === 'trending') {
        query = query.order('like_count', { ascending: false }).order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load feed');
    } finally {
      setLoading(false);
    }
  };

  const fetchSocialState = async () => {
    if (!session?.user?.id) return;
    try {
      const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', session.user.id);
      if (likes) setLikedPosts(likes.map(l => l.post_id));
      const { data: saves } = await supabase.from('post_saves').select('post_id').eq('user_id', session.user.id);
      if (saves) setSavedPosts(saves.map(s => s.post_id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFeed();
    fetchSocialState();
  }, [activeTab]);

  const handleLike = async (post: Post) => {
    if (!session?.user?.id) {
      toast.error('Sign in to like posts');
      return;
    }
    const isLiked = likedPosts.includes(post.id);
    
    // Optimistic
    setLikedPosts(prev => isLiked ? prev.filter(id => id !== post.id) : [...prev, post.id]);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, like_count: isLiked ? p.like_count - 1 : p.like_count + 1 } : p));
    
    try {
      if (isLiked) {
        await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', session.user.id);
        await supabase.rpc('decrement_post_likes', { p_post_id: post.id });
      } else {
        await supabase.from('post_likes').insert({ post_id: post.id, user_id: session.user.id });
        await supabase.rpc('increment_post_likes', { p_post_id: post.id });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (post: Post) => {
    if (!session?.user?.id) return;
    const isSaved = savedPosts.includes(post.id);
    setSavedPosts(prev => isSaved ? prev.filter(id => id !== post.id) : [...prev, post.id]);
    try {
      if (isSaved) await supabase.from('post_saves').delete().eq('post_id', post.id).eq('user_id', session.user.id);
      else await supabase.from('post_saves').insert({ post_id: post.id, user_id: session.user.id });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Top Bar */}
      <div className="bg-black/80 backdrop-blur-xl px-6 py-6 flex flex-col sticky top-0 z-30 shadow-sm border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[28px] font-bold tracking-tighter text-white">Fashion Feed</h1>
          <button 
            onClick={() => setShowUpload(true)}
            className="w-12 h-12 rounded-full bg-[#FF5FA2] flex items-center justify-center text-white shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
        <div className="flex gap-8">
          <TabButton active={activeTab === 'forYou'} label="For You" onClick={() => setActiveTab('forYou')} />
          <TabButton active={activeTab === 'following'} label="Following" onClick={() => setActiveTab('following')} />
          <TabButton active={activeTab === 'trending'} label="Trending" onClick={() => setActiveTab('trending')} />
        </div>
      </div>

      {/* Posts List */}
      <div className="pb-32">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-8 h-8 border-4 border-[#FF2D78] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Curating your style...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center px-10">
            <Camera size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">Feed is quiet</p>
            <p className="text-gray-400 text-xs mt-1">Start following people or post your first fit!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              isLiked={likedPosts.includes(post.id)}
              isSaved={savedPosts.includes(post.id)}
              onLike={() => handleLike(post)}
              onSave={() => handleSave(post)}
              onComment={() => setShowComments(post.id)}
            />
          ))
        )}
      </div>

      <AnimatePresence>
        {showUpload && (
          <UploadPostSheet 
            onClose={() => setShowUpload(false)} 
            onSuccess={() => {
              setShowUpload(false);
              fetchFeed();
            }}
          />
        )}
        {showComments && (
          <CommentsSheet 
            postId={showComments} 
            onClose={() => setShowComments(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const TabButton = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button onClick={onClick} className="relative py-1">
    <span className={`text-[15px] font-bold transition-all tracking-tight ${active ? 'text-white' : 'text-white/40'}`}>{label}</span>
    {active && (
      <motion.div 
        layoutId="tab-underline"
        className="absolute -bottom-1 left-0 right-0 h-1 bg-[#FF5FA2] rounded-full"
      />
    )}
  </button>
);

const PostCard = ({ post, isLiked, isSaved, onLike, onSave, onComment }: any) => {
  const [currentImage, setCurrentImage] = useState(0);

  return (
    <div className="bg-[#111111] rounded-[24px] mx-4 my-4 overflow-hidden border border-white/5">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/5">
            {post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-[#FF5FA2] bg-white/5">
                {post.profiles?.display_name?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-white leading-tight">{post.profiles?.display_name}</h4>
            <div className="flex items-center gap-1.5 text-white/40 text-[11px] font-bold uppercase tracking-wider mt-0.5">
               <span>@{post.profiles?.handle}</span>
               <span>·</span>
               <span>{post.town}</span>
            </div>
          </div>
        </div>
        <button className="text-white/20 hover:text-white/40 transition-colors p-2">
          <MoreHorizontal size={22} />
        </button>
      </div>

      {/* Images Carousel */}
      <div className="relative aspect-[4/5] bg-black overflow-hidden">
        <div 
          className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ transform: `translateX(-${currentImage * 100}%)` }}
        >
          {post.images.map((img: string, i: number) => (
            <img key={`post-img-${post.id}-${i}`} src={img} className="w-full h-full object-cover flex-shrink-0" alt="" referrerPolicy="no-referrer" />
          ))}
        </div>
        
        {post.images.length > 1 && (
          <>
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-4 pointer-events-none">
              {post.images.map((_: any, i: number) => (
                <div 
                  key={`dot-${post.id}-${i}`} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${currentImage === i ? 'bg-[#FF5FA2] w-6' : 'bg-white/20 w-1.5'}`}
                />
              ))}
            </div>
            
            <div className="absolute inset-y-0 left-0 right-0 flex">
               <div className="flex-1 cursor-pointer" onClick={() => setCurrentImage(prev => Math.max(0, prev - 1))} />
               <div className="flex-1 cursor-pointer" onClick={() => setCurrentImage(prev => Math.min(post.images.length - 1, prev + 1))} />
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-5">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-6">
              <button onClick={onLike} className="flex items-center gap-2 group">
                <Heart 
                  size={26} 
                  className={`transition-all duration-300 ${isLiked ? 'fill-[#FF5FA2] text-[#FF5FA2] scale-110 shadow-pink-500/20' : 'text-white group-hover:scale-110'}`} 
                />
                <span className={`text-sm font-bold ${isLiked ? 'text-[#FF5FA2]' : 'text-white/40'}`}>{post.like_count}</span>
              </button>
              <button onClick={onComment} className="flex items-center gap-2 group">
                <MessageCircle size={26} className="text-white group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-white/40">{post.comment_count}</span>
              </button>
              <button className="group">
                <Share2 size={26} className="text-white group-hover:scale-110 transition-transform" />
              </button>
           </div>
           <button onClick={onSave} className="group">
             <Bookmark 
                size={26} 
                className={`transition-all duration-300 ${isSaved ? 'fill-[#FF5FA2] text-[#FF5FA2] scale-110' : 'text-white group-hover:scale-110'}`} 
             />
           </button>
        </div>

        <div className="mt-5">
           <p className="text-[14px] text-white/80 leading-relaxed">
             <span className="font-bold mr-2">@{post.profiles?.handle}</span>
             {post.caption}
           </p>
        </div>

        {post.outfit_breakdown && (
          <div className="mt-6 pt-5 border-t border-white/5">
             <h5 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Outfit Breakdown</h5>
             <div className="flex flex-wrap gap-2.5">
                {post.outfit_breakdown.map((item: any, i: number) => (
                   <div key={`outfit-item-${post.id}-${i}`} className="px-4 py-2 rounded-full bg-white/5 border border-white/5 flex items-center gap-2 transition-colors hover:bg-white/10">
                    <span className="text-[11px] font-bold text-white">{item.brand}</span>
                    <span className="text-white/20">·</span>
                    <span className="text-[11px] font-medium text-white/60">{item.name}</span>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const UploadPostSheet = ({ onClose, onSuccess }: any) => {
  const { session } = useAuth();
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [outfitItems, setOutfitItems] = useState<Array<{name: string, brand: string}>>([]);
  const [postType, setPostType] = useState('fit');
  const [posting, setPosting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 6) {
      toast.error('Maximum 6 images allowed');
      return;
    }
    
    setImages(prev => [...prev, ...files]);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleUpload = async () => {
    if (!images.length) { toast.error('Add photos first'); return; }
    if (!caption.trim()) { toast.error('Add a caption'); return; }

    setPosting(true);
    try {
      const uploadedUrls = [];
      for (const image of images) {
        const ext = image.name.split('.').pop();
        const path = `${session?.user?.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('fashion-posts').upload(path, image);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('fashion-posts').getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }

      const { error } = await supabase.from('fashion_posts').insert({
        user_id: session?.user?.id,
        caption: caption.trim(),
        images: uploadedUrls,
        outfit_breakdown: outfitItems.length ? outfitItems : null,
        post_type: postType,
        town: localStorage.getItem('thread_user_town') || 'Harare',
        is_active: true
      });

      if (error) throw error;
      toast.success('Posted! 🔥');
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setPosting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={posting ? undefined : onClose} />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="relative w-full max-w-[430px] h-[92vh] bg-white rounded-t-[32px] flex flex-col"
      >
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-[32px]">
           <h3 className="text-xl font-bold text-[#1a1a1a]">Post a Fit</h3>
           <button onClick={onClose} disabled={posting} className="p-2 rounded-full bg-gray-50">
             <X size={18} className="text-gray-400" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
           <div className="mb-8 font-bold text-sm text-[#1a1a1a]">Select Photos (Max 6)</div>
           <div className="grid grid-cols-3 gap-3 mb-8">
              {previews.map((src, i) => (
                <div key={`preview-image-${i}`} className="aspect-square rounded-xl bg-gray-50 relative overflow-hidden group">
                   <img src={src} className="w-full h-full object-cover" alt="" />
                   <button 
                     onClick={() => {
                        setImages(prev => prev.filter((_, idx) => idx !== i));
                        setPreviews(prev => prev.filter((_, idx) => idx !== i));
                     }}
                     className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center"
                   >
                     <X size={12} />
                   </button>
                </div>
              ))}
              {previews.length < 6 && (
                <label className="aspect-square rounded-xl bg-[#F8F8F8] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all">
                   <Camera size={24} className="text-gray-300" />
                   <span className="text-[10px] font-bold text-gray-400">ADD</span>
                   <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                </label>
              )}
           </div>

           <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Caption</label>
                <textarea 
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Describe your match... where you got it... the vibe..."
                  className="w-full min-h-[120px] bg-gray-50 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#FF2D78]/20 transition-all border-none resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Outfit Breakdown</label>
                  <button 
                    onClick={() => setOutfitItems(prev => [...prev, { name: '', brand: '' }])}
                    className="text-[#FF2D78] text-[10px] font-bold py-1 px-3 border border-[#FF2D78] rounded-full"
                  >
                    + ADD ITEM
                  </button>
                </div>
                
                <div className="space-y-3">
                   {outfitItems.map((item, i) => (
                     <div key={`outfit-item-${i}`} className="flex gap-2 items-center">
                        <input 
                          placeholder="Item (e.g. Vintage Tee)"
                          className="flex-1 bg-gray-50 rounded-xl p-3 text-sm"
                          value={item.name}
                          onChange={e => {
                            const newItems = [...outfitItems];
                            newItems[i].name = e.target.value;
                            setOutfitItems(newItems);
                          }}
                        />
                        <input 
                          placeholder="Brand"
                          className="w-1/3 bg-gray-50 rounded-xl p-3 text-sm"
                          value={item.brand}
                          onChange={e => {
                            const newItems = [...outfitItems];
                            newItems[i].brand = e.target.value;
                            setOutfitItems(newItems);
                          }}
                        />
                        <button onClick={() => setOutfitItems(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-300">
                          <X size={18} />
                        </button>
                     </div>
                   ))}
                   {!outfitItems.length && (
                     <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dotted border-gray-200">
                       <p className="text-[11px] text-gray-400">Optional: Add brands to inspire others!</p>
                     </div>
                   )}
                </div>
              </div>
           </div>
        </div>

        <div className="p-6 border-t border-gray-50 sticky bottom-0 bg-white">
           <button 
             onClick={handleUpload}
             disabled={posting || !images.length || !caption.trim()}
             className="w-full h-14 rounded-full bg-gradient-to-r from-[#9B27AF] to-[#FF2D78] text-white font-bold disabled:opacity-50 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
           >
             {posting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Post to Feed 🔥'}
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const CommentsSheet = ({ postId, onClose }: any) => {
  const { session } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles:user_id (display_name, avatar_url, handle)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (data) setComments(data);
    };
    fetchComments();
  }, [postId]);

  const handleSend = async () => {
    if (!newComment.trim() || !session?.user?.id) return;
    setSending(true);
    try {
      const { data, error } = await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: session.user.id,
        content: newComment.trim()
      }).select(`*, profiles:user_id (display_name, avatar_url, handle)`).single();
      
      if (data) {
        setComments(prev => [...prev, data]);
        setNewComment('');
        await supabase.from('fashion_posts').update({ comment_count: comments.length + 1 }).eq('id', postId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="relative w-full max-w-[430px] h-[75vh] bg-white rounded-t-[32px] flex flex-col"
      >
        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
           <h4 className="font-bold text-center flex-1">Comments</h4>
           <button onClick={onClose} className="p-2"><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
           {comments.map(c => (
             <div key={c.id} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                   {c.profiles?.avatar_url && <img src={c.profiles.avatar_url} className="w-full h-full object-cover" alt="" />}
                </div>
                <div className="flex-1">
                   <div className="bg-gray-50 rounded-2xl px-4 py-3">
                      <span className="font-bold text-xs text-[#1a1a1a] mr-2 transition-all hover:text-[#FF2D78] cursor-pointer">
                        {c.profiles?.display_name || 'User'}
                      </span>
                      <p className="text-sm text-gray-700 mt-1">{c.content}</p>
                   </div>
                   <div className="flex gap-4 mt-1.5 ml-2">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Reply</button>
                      <button className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Like</button>
                   </div>
                </div>
             </div>
           ))}
           {!comments.length && (
             <div className="py-20 text-center opacity-30">
               <MessageCircle size={40} className="mx-auto mb-2" />
               <p className="text-sm">No comments yet. Be first!</p>
             </div>
           )}
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center gap-3 bg-white sticky bottom-0">
           <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
             {/* Auth user avatar */}
           </div>
           <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2 border border-gray-200">
              <input 
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="bg-transparent border-none focus:ring-0 text-sm flex-1"
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                disabled={!newComment.trim() || sending}
                className={`p-1.5 rounded-full ${newComment.trim() ? 'bg-[#FF2D78] text-white' : 'bg-gray-300 text-white'}`}
              >
                <Send size={16} />
              </button>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
