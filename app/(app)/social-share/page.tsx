"use client"

import React, { useState, useEffect, useRef} from 'react'
import { CldImage, CldOgImage } from 'next-cloudinary';

const socialFormats = {
  "Instagram Square (1:1)": { width: 1080, height: 1080, aspectRatio: "1:1" },
  "Instagram Portrait (4:5)": { width: 1080, height: 1350, aspectRatio: "4:5" },
  "Instagram Landscape (1.91:1)": { width: 1080, height: 566, aspectRatio: "1.91:1" },
  "Facebook Post (1.91:1)": { width: 1200, height: 628, aspectRatio: "1.91:1" },
  "Facebook Cover (205:78)": { width: 820, height: 312, aspectRatio: "205:78" },
  "Twitter Post (16:9)": { width: 1024, height: 512, aspectRatio: "16:9" },
  "Twitter Header (3:1)": { width: 1500, height: 500, aspectRatio: "3:1" },
};

type SocialFormat = keyof typeof socialFormats;

export default function SocialShare() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<SocialFormat>("Instagram Square (1:1)");
  const [isUploading, setIsUploading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (uploadedImage) {
      setIsTransforming(true);
    }
  }, [selectedFormat, uploadedImage]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/image-upload', {
        method: 'POST',
        body: formData,
        })

        if(!response.ok) throw new Error("Failed to upload image");

        const data = await response.json();
        setUploadedImage(data.publicId);

    } catch (error) {
      console.log(error);
      alert('Image upload failed! Please try again.');


    } finally {
        setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (!imageRef.current) return;

    fetch (imageRef.current.src)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedFormat.replace(/\s+/g, "_").toLowerCase()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
  }



  return (
        <div className="container mx-auto p-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Social Media Image Creator
          </h1>

          <div className="card bg-stone-800  rounded-xl">
            <div className="card-body">
              <h2 className="card-title mb-4 text-2xl">Upload an Image</h2>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-l text-stone-400">Choose an image file to upload:</span>
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="file-input w-full border-none "
                />
              </div>

              {isUploading && (
                <div className="mt-4">
                  <progress className="progress progress-success fill-gray-800 w-full"></progress>
                </div>
              )}

              {uploadedImage && (
                <div className="mt-6">
                  <h2 className="text-l text-stone-400 mb-4 ">Select Social Media Format</h2>
                  <div className="form-control">
                    <select
                      className="select select-bordered bg-stone-900 w-full"
                      value={selectedFormat}
                      onChange={(e) =>
                        setSelectedFormat(e.target.value as SocialFormat)
                      }
                    >
                      {Object.keys(socialFormats).map((format) => (
                        <option key={format} value={format}>
                          {format}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-6 relative">
                    <h3 className="text-lg font-semibold mb-2">Preview:</h3>
                    <div className="flex justify-center">
                      {isTransforming && (
                        <div className="absolute inset-0 flex items-center justify-center bg-base-100 bg-opacity-50 z-10">
                          <span className="loading loading-spinner loading-lg"></span>
                        </div>
                      )}
                      <CldOgImage src="<publicId>"
                        width={socialFormats[selectedFormat].width}
                        height={socialFormats[selectedFormat].height}
                        alt="Social Media Preview"
                        overlays={[
                          {
                            publicId: uploadedImage!,
                            position: { gravity: 'south-east', x: 20, y: 20
                            }
                          } 
                          ,]}

                        />
                          <CldImage
                            width={socialFormats[selectedFormat].width}
                            height={socialFormats[selectedFormat].height}
                            src={uploadedImage}
                            sizes="100vw"
                            alt="transformed image"
                            crop="fill"
                            aspectRatio={socialFormats[selectedFormat].aspectRatio}
                            gravity='auto'
                            ref={imageRef}
                            onLoad={() => setIsTransforming(false)}
                            />
                          
                      
                    </div>
                  </div>
                      
                  <div className="card-actions justify-end mt-6">
                    <button className="btn border-2 rounded-xl bg-gray-800 p-6" onClick={handleDownload}>
                      Download for {selectedFormat}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
}

SocialShare