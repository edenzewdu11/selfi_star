import { useState, useRef } from 'react';
import { X, Image, Video, FileText } from 'lucide-react';
import api from '../api';
import { useTheme } from '../contexts/ThemeContext';

export function EditPostModal({ video, onClose, onUpdate }) {
  const { colors: T } = useTheme();
  const [caption, setCaption] = useState(video?.caption || '');
  const [hashtags, setHashtags] = useState(video?.hashtags?.join(' ') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('caption', caption);
      
      // Parse hashtags and add them
      const hashtagList = hashtags.split(' ').filter(tag => tag.startsWith('#')).map(tag => tag.substring(1));
      formData.append('hashtags', JSON.stringify(hashtagList));

      // Add new files if any
      newFiles.forEach(file => {
        formData.append('media', file);
      });

      const response = await api.request(`/reels/${video.id}/`, {
        method: 'PATCH',
        body: formData,
        isFormData: true
      });

      onUpdate?.(response);
      onClose();
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('Failed to update post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles(files);
    
    // Create preview URLs
    const urls = files.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      } else if (file.type.startsWith('video/')) {
        return URL.createObjectURL(file);
      }
      return null;
    });
    setPreviewUrls(urls);
  };

  const removeFile = (index) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.startsWith('video/')) return Video;
    return FileText;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
    }}>
      <div style={{
        background: T.cardBg,
        borderRadius: 16,
        width: '100%',
        maxWidth: 600,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: `1px solid ${T.border}`,
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            color: T.txt,
            margin: 0,
          }}>
            Edit Post
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.sub,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = T.bg}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Current Media Preview */}
          {video?.imageUrl && (
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: T.txt,
                marginBottom: 8,
              }}>
                Current Media
              </label>
              <div style={{
                borderRadius: 12,
                overflow: 'hidden',
                background: '#000',
                aspectRatio: '9/16',
                maxHeight: 300,
              }}>
                {video.isVideo ? (
                  <video
                    src={video.imageUrl.startsWith('http') ? video.imageUrl : `http://localhost:8000${video.imageUrl}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    controls={false}
                    muted
                    loop
                    autoPlay
                  />
                ) : (
                  <img
                    src={video.imageUrl.startsWith('http') ? video.imageUrl : `http://localhost:8000${video.imageUrl}`}
                    alt="Current media"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Caption */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: T.txt,
              marginBottom: 8,
            }}>
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption for your post..."
              style={{
                width: '100%',
                minHeight: 100,
                padding: '12px 16px',
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                background: T.bg,
                color: T.txt,
                fontSize: 14,
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = T.pri}
              onBlur={(e) => e.target.style.borderColor = T.border}
            />
          </div>

          {/* Hashtags */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: T.txt,
              marginBottom: 8,
            }}>
              Hashtags
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#fun #dance #music"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                background: T.bg,
                color: T.txt,
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = T.pri}
              onBlur={(e) => e.target.style.borderColor = T.border}
            />
            <p style={{
              fontSize: 12,
              color: T.sub,
              marginTop: 4,
              margin: 0,
            }}>
              Separate hashtags with spaces
            </p>
          </div>

          {/* Add New Media */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: T.txt,
              marginBottom: 8,
            }}>
              Replace Media (Optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px dashed ${T.border}`,
                borderRadius: 8,
                background: T.bg,
                color: T.txt,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = T.pri;
                e.currentTarget.style.background = T.pri + '10';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.background = T.bg;
              }}
            >
              📎 Choose New Media
            </button>
          </div>

          {/* New Files Preview */}
          {previewUrls.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: T.txt,
                marginBottom: 8,
              }}>
                New Media Preview
              </label>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {previewUrls.map((url, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    {newFiles[index].type.startsWith('video/') ? (
                      <video
                        src={url}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 8,
                          objectFit: 'cover',
                        }}
                        muted
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`Preview ${index}`}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 8,
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#EF4444',
                        border: '2px solid #fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
            paddingTop: 20,
            borderTop: `1px solid ${T.border}`,
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                background: 'transparent',
                color: T.txt,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = T.bg}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: 8,
                background: isLoading ? T.sub : T.pri,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Updating...' : 'Update Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
