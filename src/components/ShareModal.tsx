import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    id: string;
    title: string;
    description?: string;
    url: string;
  };
}

export function ShareModal({ isOpen, onClose, content }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Add UTM parameters to track shares
  const getShareableLink = (platform: string) => {
    const url = new URL(content.url);
    url.searchParams.set('utm_source', platform);
    url.searchParams.set('utm_medium', 'social');
    url.searchParams.set('utm_campaign', 'referral_program');
    return url.toString();
  };

  // Generate platform-specific share URLs
  const getFacebookShareUrl = () => {
    const url = getShareableLink('facebook');
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  };

  const getTwitterShareUrl = () => {
    const url = getShareableLink('twitter');
    const text = `${content.title}\n\n${content.description || ''}`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  };

  const getLinkedInShareUrl = () => {
    const url = getShareableLink('linkedin');
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getShareableLink('direct'));
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const openShareWindow = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Share Content
                </Dialog.Title>

                {/* Copyable Link */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Share Link
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      readOnly
                      value={getShareableLink('direct')}
                      className="block w-full rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Social Share Buttons */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Share on Social Media
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    <button
                      onClick={() => openShareWindow(getFacebookShareUrl())}
                      className="inline-flex items-center justify-center rounded-md bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1877F2]/90"
                    >
                      Facebook
                    </button>
                    <button
                      onClick={() => openShareWindow(getTwitterShareUrl())}
                      className="inline-flex items-center justify-center rounded-md bg-[#1DA1F2] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1DA1F2]/90"
                    >
                      Twitter
                    </button>
                    <button
                      onClick={() => openShareWindow(getLinkedInShareUrl())}
                      className="inline-flex items-center justify-center rounded-md bg-[#0A66C2] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0A66C2]/90"
                    >
                      LinkedIn
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
