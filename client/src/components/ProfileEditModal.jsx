import { useCharacterLimit } from "./hooks/use-character-limit";
import { useImageUpload } from "./hooks/use-image-upload";
import { Button } from "./ui/button";
import { GradientButton } from "./ui/GradientButton";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ImagePlus, X, Loader2, Link, Plus, Trash2 } from "lucide-react";
import { useId, useState, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

export function ProfileEditModal({ children, open, onOpenChange }) {
  const id = useId();
  const { authUser, updateProfile } = useContext(AuthContext);
  
  const maxLength = 180;
  const {
    value,
    setValue,
    characterCount,
    setCharacterCount,
    handleChange,
    maxLength: limit,
  } = useCharacterLimit({
    maxLength,
    initialValue: authUser?.bio || "",
  });

  const [name, setName] = useState(authUser?.fullName || "");
  const [socialLinks, setSocialLinks] = useState(authUser?.socialLinks?.length ? authUser.socialLinks : [""]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authUser?.fullName) {
      setName(authUser.fullName);
    }
  }, [authUser?.fullName]);

  // 3D card tilt effect
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 })

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setTilt({
      rotateX: (y / 300) * -8,
      rotateY: (x / 300) * 8
    })
  }

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 })
  }

  // For avatar upload
  const { previewUrl, fileInputRef, handleThumbnailClick, handleFileChange, handleRemove } =
    useImageUpload();
    
  const currentImage = previewUrl || authUser?.profilePic || "https://originui.com/avatar-72-01.jpg";

  // Reset states khi modal bật lên (chỉ chạy khi 'open' chuyển từ false sang true)
  useEffect(() => {
    if (open && authUser) {
      setName(authUser.fullName || "");
      setValue(authUser.bio || "");
      setSocialLinks(authUser.socialLinks?.length ? authUser.socialLinks : [""]);
      setCharacterCount((authUser.bio || "").length);
      handleRemove(); // Reset ảnh xem trước
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Xóa các link rỗng trước khi lưu
    const validLinks = socialLinks.filter(link => link.trim() !== "");

    try {
      if (fileInputRef.current?.files?.[0]) {
        // Có ảnh mới -> Base64
        const file = fileInputRef.current.files[0];
        
        const base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const MAX_WIDTH = 500;
              const MAX_HEIGHT = 500;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL(file.type || "image/jpeg", 0.7)); // Nén 70%
            };
            img.onerror = reject;
            img.src = e.target.result;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        await updateProfile({ profilePic: base64Image, fullName: name, bio: value, socialLinks: validLinks });
      } else {
        // Không có ảnh mới
        await updateProfile({ fullName: name, bio: value, socialLinks: validLinks });
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("Đã xảy ra lỗi, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-transparent border-none p-0 shadow-none sm:bg-transparent sm:backdrop-blur-none overflow-visible w-full max-w-sm [&>button:last-child]:hidden outline-none">
        <div
          className="relative transition-transform duration-150 ease-out w-full"
          style={{ transform: `perspective(1500px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)` }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative group w-full">
            {/* Card glow effect */}
            <motion.div
              className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
              animate={{
                boxShadow: [
                  "0 0 10px 2px rgba(0,207,255,0.05)",
                  "0 0 20px 5px rgba(0,207,255,0.1)",
                  "0 0 10px 2px rgba(0,207,255,0.05)"
                ],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }}
            />

            {/* Traveling light beam effect */}
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none">
              <motion.div className="absolute top-0 left-0 h-[3px] w-[60%] bg-gradient-to-r from-transparent via-orange-500 dark:via-cyan-400 to-transparent blur-[1px]" animate={{ left: ["-60%", "100%"] }} transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5 }} />
              <motion.div className="absolute top-0 right-0 h-[60%] w-[3px] bg-gradient-to-b from-transparent via-orange-500 dark:via-cyan-400 to-transparent blur-[1px]" animate={{ top: ["-60%", "100%"] }} transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5, delay: 0.75 }} />
              <motion.div className="absolute bottom-0 right-0 h-[3px] w-[60%] bg-gradient-to-l from-transparent via-orange-500 dark:via-cyan-400 to-transparent blur-[1px]" animate={{ right: ["-60%", "100%"] }} transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5, delay: 1.5 }} />
              <motion.div className="absolute bottom-0 left-0 h-[60%] w-[3px] bg-gradient-to-t from-transparent via-orange-500 dark:via-cyan-400 to-transparent blur-[1px]" animate={{ bottom: ["-60%", "100%"] }} transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5, delay: 2.25 }} />
              
              <motion.div className="absolute top-0 left-0 h-[6px] w-[6px] rounded-full bg-orange-400/60 dark:bg-cyan-400/60 blur-[2px]" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }} />
              <motion.div className="absolute top-0 right-0 h-[8px] w-[8px] rounded-full bg-orange-400/70 dark:bg-cyan-400/70 blur-[3px]" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.4, repeat: Infinity, repeatType: "mirror", delay: 0.5 }} />
              <motion.div className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full bg-orange-400/70 dark:bg-cyan-400/70 blur-[3px]" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.2, repeat: Infinity, repeatType: "mirror", delay: 1 }} />
              <motion.div className="absolute bottom-0 left-0 h-[6px] w-[6px] rounded-full bg-orange-400/60 dark:bg-cyan-400/60 blur-[2px]" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.3, repeat: Infinity, repeatType: "mirror", delay: 1.5 }} />
            </div>

            {/* Card border glow on hover */}
            <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-orange-500/5 via-orange-400/10 to-orange-500/5 dark:from-cyan-500/5 dark:via-cyan-400/10 dark:to-cyan-500/5 opacity-0 group-hover:opacity-70 transition-opacity duration-500" />

            {/* Glass card background */}
            <div className="relative bg-white/90 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col gap-0">
              {/* Subtle card inner pattern */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03] opacity-[0.1] pointer-events-none" style={{ backgroundImage: 'linear-gradient(135deg, currentColor 0.5px, transparent 0.5px), linear-gradient(45deg, currentColor 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />

              <DialogHeader className="contents space-y-0 text-left relative z-10">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] px-6 py-4">
                  <DialogTitle className="text-base text-orange-600 dark:text-[#00cfff]">
                    Chỉnh sửa hồ sơ
                  </DialogTitle>
                  <DialogClose className="text-slate-500 hover:text-slate-800 dark:text-white/40 dark:hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </DialogClose>
                </div>
              </DialogHeader>
        <DialogDescription className="sr-only">
          Thay đổi thông tin hồ sơ của bạn tại đây.
        </DialogDescription>
        <div className="overflow-y-auto">
          <div className="pt-8 px-6 pb-2">
            <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 shadow-lg shadow-orange-500/10 dark:shadow-cyan-500/10">
              <img
                src={currentImage}
                className="h-full w-full object-cover"
                width={80}
                height={80}
                alt="Profile image"
                onError={(e) => { e.target.onerror = null; e.target.src = "https://originui.com/avatar-72-01.jpg"; }}
              />
              <button
                type="button"
                className="absolute flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/40 dark:bg-black/60 text-white outline-offset-2 transition-colors hover:bg-black/60 dark:hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 dark:focus-visible:outline-[#00cfff]"
                onClick={handleThumbnailClick}
                aria-label="Change profile picture"
              >
                <ImagePlus size={16} strokeWidth={2} aria-hidden="true" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                aria-label="Upload profile picture"
              />
            </div>
          </div>

          <div className="px-6 pb-6 pt-4">
            <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${id}-fullname`} className="text-slate-700 dark:text-gray-300">Họ và tên</Label>
                <Input
                  id={`${id}-fullname`}
                  placeholder="Tên của bạn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  required
                  className="bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700 dark:text-gray-300">Liên kết mạng xã hội (Website)</Label>
                  <button type="button" onClick={() => setSocialLinks([...socialLinks, ""])} className="text-orange-600 hover:text-orange-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors p-1 flex items-center justify-center bg-orange-500/10 dark:bg-cyan-500/10 rounded-full">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {socialLinks.map((link, index) => (
                  <div key={index} className="relative flex items-center gap-2">
                    <div className="relative flex-1 flex items-center">
                      <span className="absolute left-3 text-orange-500 dark:text-cyan-400">
                        <Link className="w-4 h-4" />
                      </span>
                      <Input
                        placeholder="https://example.com/yourprofile"
                        value={link}
                        onChange={(e) => {
                          const newLinks = [...socialLinks];
                          newLinks[index] = e.target.value;
                          setSocialLinks(newLinks);
                        }}
                        type="text"
                        className="pl-10 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
                      />
                    </div>
                    {socialLinks.length > 1 && (
                      <button type="button" onClick={() => setSocialLinks(socialLinks.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`${id}-bio`} className="text-slate-700 dark:text-gray-300">Lời giới thiệu</Label>
                <Textarea
                  id={`${id}-bio`}
                  placeholder="Viết một vài dòng về bản thân..."
                  value={value}
                  maxLength={maxLength}
                  onChange={handleChange}
                  aria-describedby={`${id}-description`}
                  className="resize-none bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                />
                <p
                  id={`${id}-description`}
                  className="mt-2 text-right text-xs text-slate-500 dark:text-gray-400"
                  role="status"
                  aria-live="polite"
                >
                  Còn lại <span className="tabular-nums font-medium text-orange-600 dark:text-cyan-400">{limit - characterCount}</span> ký tự
                </p>
              </div>
            </form>
          </div>
        </div>
        <DialogFooter className="border-t border-slate-200 dark:border-white/[0.08] px-6 py-4 relative z-10 bg-slate-50/50 dark:bg-transparent">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/5 bg-white dark:bg-transparent shadow-sm dark:shadow-none text-slate-700 dark:text-white">
              Hủy
            </Button>
          </DialogClose>
          <GradientButton type="submit" form="profile-form" disabled={isLoading} className="h-9 px-6 min-w-0 rounded-lg text-sm shadow-[0_0_15px_rgba(249,115,22,0.2)] dark:shadow-[0_0_15px_rgba(0,207,255,0.2)]">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Lưu thay đổi
          </GradientButton>
        </DialogFooter>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
