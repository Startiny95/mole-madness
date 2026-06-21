/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Upload, Trash2, Camera, User, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface PhotoUploaderProps {
  hisPhotos: string[];
  herPhotos: string[];
  onUpdateHisPhotos: (photos: string[]) => void;
  onUpdateHerPhotos: (photos: string[]) => void;
  onClearAll: () => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  hisPhotos,
  herPhotos,
  onUpdateHisPhotos,
  onUpdateHerPhotos,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hisInputRef = useRef<HTMLInputElement>(null);
  const herInputRef = useRef<HTMLInputElement>(null);

  const [hisDragActive, setHisDragActive] = useState(false);
  const [herDragActive, setHerDragActive] = useState(false);

  // Read file utility to convert to base 64
  const processFiles = (files: FileList, type: 'HIM' | 'HER') => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) return;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          const base64Str = e.target.result;
          if (type === 'HIM') {
            if (hisPhotos.length >= 5) {
              alert('Maximum 5 custom photos allowed for Boyfriend set. Delete some first!');
              return;
            }
            onUpdateHisPhotos([...hisPhotos, base64Str]);
          } else {
            if (herPhotos.length >= 5) {
              alert('Maximum 5 custom photos allowed for Girlfriend set. Delete some first!');
              return;
            }
            onUpdateHerPhotos([...herPhotos, base64Str]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'HIM' | 'HER') => {
    if (e.target.files) {
      processFiles(e.target.files, type);
    }
  };

  const handleDrag = (e: React.DragEvent, type: 'HIM' | 'HER', active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'HIM') setHisDragActive(active);
    else setHerDragActive(active);
  };

  const handleDrop = (e: React.DragEvent, type: 'HIM' | 'HER') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'HIM') setHisDragActive(false);
    else setHerDragActive(false);

    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files, type);
    }
  };

  const removePhoto = (index: number, type: 'HIM' | 'HER') => {
    if (type === 'HIM') {
      const updated = hisPhotos.filter((_, idx) => idx !== index);
      onUpdateHisPhotos(updated);
    } else {
      const updated = herPhotos.filter((_, idx) => idx !== index);
      onUpdateHerPhotos(updated);
    }
  };

  return (
    <div className="w-full bg-white rounded-[1.5rem] border-[3px] border-[#6366F1] shadow-[4px_4px_0_#4338CA] overflow-hidden mb-5 transition-all duration-300">
      {/* Header trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3.5 px-4 flex items-center justify-between text-slate-700 font-display font-bold text-xs tracking-wider cursor-pointer select-none bg-indigo-50/20 hover:bg-indigo-50/40 transition duration-150 border-b-2 border-slate-100"
      >
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-pink-500 animate-pulse" />
          <span className="font-extrabold text-indigo-700">📸 CUSTOMIZE MOLE PHOTOS</span>
          {(hisPhotos.length > 0 || herPhotos.length > 0) && (
            <span className="bg-pink-100 text-pink-700 rounded-full px-2 py-0.5 text-[10px] font-extrabold shadow-sm animate-bounce border border-pink-200">
              {hisPhotos.length + herPhotos.length} Added!
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            {isOpen ? "Collapse" : "Expand Upload"}
          </span>
          {isOpen ? <ChevronUp size={16} className="text-indigo-600" /> : <ChevronDown size={16} className="text-indigo-600" />}
        </div>
      </button>

      {/* Accordion panel content */}
      {isOpen && (
        <div className="p-4 md:p-5 bg-indigo-50/5/10 space-y-5 animate-pop-up">
          <div className="text-center max-w-sm mx-auto mb-3">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Drag-and-drop or select your pictures below. Feel free to use the 10 files you uploaded to the assistant! They'll stay saved across reflows in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* BOYFRIEND / HIS PHOTOS SET */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 justify-between">
                <span className="flex items-center gap-1">
                  <User size={13} className="text-blue-500" />
                  His Picture Set <span className="text-[10px] text-blue-500 font-medium">(Boyfriend, max 5)</span>
                </span>
                <span className="font-mono text-[9px] text-slate-400 font-medium">{hisPhotos.length}/5</span>
              </label>

              {/* Upload Dropzone */}
              <div
                onDragEnter={(e) => handleDrag(e, 'HIM', true)}
                onDragOver={(e) => handleDrag(e, 'HIM', true)}
                onDragLeave={(e) => handleDrag(e, 'HIM', false)}
                onDrop={(e) => handleDrop(e, 'HIM')}
                onClick={() => hisInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[96px] ${
                  hisDragActive
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={hisInputRef}
                  onChange={(e) => handleFileChange(e, 'HIM')}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <Upload size={20} className="text-blue-400 mb-1" />
                <span className="text-[10px] font-semibold text-slate-600 block">Click or Drop "His" Photos here</span>
                <span className="text-[9px] text-slate-400 mt-0.5">JPG or PNG (Supports up to 5)</span>
              </div>

              {/* Thumbnail list */}
              {hisPhotos.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {hisPhotos.map((p, idx) => (
                    <div key={idx} className="relative group w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                      <img src={p} alt="Bf" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(idx, 'HIM');
                        }}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[9px] text-slate-400 italic">No custom photos - playing with our customized smart boyfriend avatars</p>
              )}
            </div>

            {/* GIRLFRIEND / HER PHOTOS SET */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 justify-between">
                <span className="flex items-center gap-1">
                  <User size={13} className="text-pink-500" />
                  Her Picture Set <span className="text-[10px] text-pink-500 font-medium">(Girlfriend, max 5)</span>
                </span>
                <span className="font-mono text-[9px] text-slate-400 font-medium">{herPhotos.length}/5</span>
              </label>

              {/* Upload Dropzone */}
              <div
                onDragEnter={(e) => handleDrag(e, 'HER', true)}
                onDragOver={(e) => handleDrag(e, 'HER', true)}
                onDragLeave={(e) => handleDrag(e, 'HER', false)}
                onDrop={(e) => handleDrop(e, 'HER')}
                onClick={() => herInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[96px] ${
                  herDragActive
                    ? 'border-pink-500 bg-pink-50/50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={herInputRef}
                  onChange={(e) => handleFileChange(e, 'HER')}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <Upload size={20} className="text-pink-400 mb-1" />
                <span className="text-[10px] font-semibold text-slate-600 block">Click or Drop "Her" Photos here</span>
                <span className="text-[9px] text-slate-400 mt-0.5">JPG or PNG (Supports up to 5)</span>
              </div>

              {/* Thumbnail list */}
              {herPhotos.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {herPhotos.map((p, idx) => (
                    <div key={idx} className="relative group w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                      <img src={p} alt="Gf" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(idx, 'HER');
                        }}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[9px] text-slate-400 italic">No custom photos - playing with our customized smart girlfriend avatars</p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-100/60 pt-3 text-[10px]">
            <span className="text-slate-400 inline-flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500 animate-spin" /> Live updates instantly merge into the game!
            </span>
            {(hisPhotos.length > 0 || herPhotos.length > 0) && (
              <button
                onClick={onClearAll}
                className="text-rose-500 hover:text-rose-600 font-semibold cursor-pointer underline hover:no-underline"
              >
                Clear all custom photos
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
