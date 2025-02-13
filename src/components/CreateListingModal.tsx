'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateListingModal({ isOpen, onClose }: CreateListingModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [price, setPrice] = useState<number>(0);
  const platformFeePercentage = 0.01; // 1% platform fee
  const maxPlatformFee = 1000; // Maximum platform fee capped at ₦1000

  const calculateFinalAmount = (price: number) => {
    const calculatedFee = price * platformFeePercentage;
    const platformFee = Math.min(calculatedFee, maxPlatformFee); // Cap the fee at ₦1000
    const finalAmount = price - platformFee;
    return { platformFee, finalAmount };
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value) || 0;
    setPrice(newPrice);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      const base64Images = await Promise.all(
        fileArray.map(async (file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('Failed to convert image'));
              }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
        })
      );
      setImages(base64Images);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim() && !tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setTagInput('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const listingData = {
        title: formData.get('title'),
        description: formData.get('description'),
        price: Number(formData.get('price')),
        category: formData.get('category'),
        condition: formData.get('condition'),
        images: images,
        tags,
      };

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      });

      if (!res.ok) {
        throw new Error('Failed to create listing');
      }

      const { id } = await res.json();
      router.refresh();
      router.push(`/listings/${id}`);
      onClose();
      // Reset form
      setImages([]);
      setTags([]);
      setTagInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Add image preview component
  const ImagePreviews = () => (
    <div className="grid grid-cols-2 gap-4 mb-4">
      {images.map((image, index) => (
        <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={`Preview ${index + 1}`}
            className="object-cover w-full h-full"
          />
          <button
            type="button"
            onClick={() => setImages(images.filter((_, i) => i !== index))}
            className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50 w-full sm:max-w-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto bg-background rounded-t-lg sm:rounded-lg border shadow-lg safe-bottom pb-[80px] sm:pb-0">
        <div className="sticky top-0 bg-background border-b z-10">
          {/* Mobile drag indicator */}
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto my-3 sm:hidden" />
          
          <div className="flex justify-between items-center px-6 pb-4">
            <h2 className="text-xl font-semibold text-primary">Create New Listing</h2>
            <button
              onClick={onClose}
              className="p-2 -m-2 text-muted-foreground hover:text-foreground"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 pt-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="w-full rounded-lg border border-input px-4 py-3 sm:py-2"
                placeholder="What are you selling?"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                className="w-full rounded-lg border border-input px-4 py-3 sm:py-2"
                placeholder="Describe your item..."
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-2">
                Price (₦)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                required
                min="0"
                value={price}
                onChange={handlePriceChange}
                className="w-full rounded-lg border border-input px-4 py-3 sm:py-2"
                placeholder="0.00"
              />
              {price > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>Platform fee (1%): ₦{calculateFinalAmount(price).platformFee.toFixed(2)}</p>
                  <p className="font-medium text-foreground">
                    You will receive: ₦{calculateFinalAmount(price).finalAmount.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full rounded-lg border border-input px-4 py-3 sm:py-2 bg-background"
              >
                <option value="">Select a category</option>
                <option value="Textbooks">Textbooks</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Notes">Notes</option>
                <option value="Clothing">Clothing</option>
                <option value="Sports">Sports</option>
                <option value="Food">Food</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="condition" className="block text-sm font-medium mb-2">
                Condition
              </label>
              <select
                id="condition"
                name="condition"
                required
                className="w-full rounded-lg border border-input px-4 py-3 sm:py-2 bg-background"
              >
                <option value="">Select condition</option>
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <div>
              <label htmlFor="images" className="block text-sm font-medium mb-2">
                Images
              </label>
              {images.length > 0 && <ImagePreviews />}
              <div className="relative">
                <input
                  type="file"
                  id="images"
                  name="images"
                  multiple
                  accept="image/*"
                  required={images.length === 0}
                  onChange={handleImageChange}
                  className="w-full rounded-lg border border-input px-4 py-3 sm:py-2 file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0 file:text-sm file:font-medium
                    file:bg-muted file:text-foreground hover:file:bg-muted/80"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Upload up to 4 images. First image will be the cover.
              </p>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-muted"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((_, i) => i !== index))}
                      className="ml-2 hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="w-full rounded-lg border border-input px-4 py-3 sm:py-2"
                placeholder="Add tags (press Enter or comma to add)"
              />
            </div>

            <div className="sticky bottom-0 -mx-6 -mb-6 p-6 bg-background border-t">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-4 py-3 sm:py-2 rounded-lg border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-2 rounded-lg bg-primary text-background hover:bg-primary/90 font-medium disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Listing"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
