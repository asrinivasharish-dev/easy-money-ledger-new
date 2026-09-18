import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Smartphone,
  BookUser,
  User,
  Phone,
  Check,
  AlertCircle,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { formatINR } from '../utils/interestCalculator';

export interface SavedContact {
  name: string;
  mobile: string;
  activeCredits?: number;
  unpaid?: number;
}

interface ContactPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (contact: { name: string; mobile: string }) => void;
  savedContacts: SavedContact[];
  currentName?: string;
  currentMobile?: string;
}

export const ContactPickerModal: React.FC<ContactPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectContact,
  savedContacts,
  currentName = '',
  currentMobile = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPickingDeviceContact, setIsPickingDeviceContact] = useState(false);
  const [updateNameAlso, setUpdateNameAlso] = useState<boolean>(!currentName.trim());

  // Check if browser supports the native Web Contact Picker API
  const isDeviceContactsSupported = useMemo(() => {
    return (
      typeof window !== 'undefined' &&
      'contacts' in navigator &&
      typeof (navigator as unknown as { contacts: { select: unknown } }).contacts?.select === 'function'
    );
  }, []);

  if (!isOpen) return null;

  // Filter saved contacts based on search query
  const filteredContacts = savedContacts.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = c.name.toLowerCase().includes(q);
    const phoneMatch = c.mobile.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
    return nameMatch || phoneMatch;
  });

  // Handle native Web Contact Picker
  const handlePickFromDevice = async () => {
    setErrorMessage(null);
    setIsPickingDeviceContact(true);

    try {
      if (!isDeviceContactsSupported) {
        throw new Error('Web Contact Picker is not supported on this browser or platform.');
      }

      const navContacts = (navigator as unknown as {
        contacts: {
          select: (props: string[], opts?: { multiple?: boolean }) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
        };
      }).contacts;

      const contacts = await navContacts.select(['name', 'tel'], { multiple: false });

      if (contacts && contacts.length > 0) {
        const picked = contacts[0];
        const rawTel = Array.isArray(picked.tel) && picked.tel.length > 0 ? picked.tel[0] : '';
        const rawName = Array.isArray(picked.name) && picked.name.length > 0 ? picked.name[0] : '';

        if (!rawTel) {
          setErrorMessage('The selected contact does not have a registered phone number.');
          return;
        }

        // Clean up phone number format
        const cleanMobile = rawTel.trim();
        const contactName = rawName.trim() || currentName.trim() || 'Contact';

        onSelectContact({
          name: updateNameAlso || !currentName.trim() ? contactName : currentName,
          mobile: cleanMobile,
        });
        onClose();
      }
    } catch (err: unknown) {
      console.warn('Contact picker error:', err);
      const errorObj = err as { name?: string; message?: string };
      if (errorObj?.name === 'AbortError') {
        // User canceled selection, no need for prominent error
        setErrorMessage('Contact selection was cancelled.');
      } else {
        setErrorMessage(
          'Device contacts could not be accessed in this browser session. Please choose from your saved contacts or enter the number manually.'
        );
      }
    } finally {
      setIsPickingDeviceContact(false);
    }
  };

  const handleSelectSaved = (contact: SavedContact) => {
    onSelectContact({
      name: updateNameAlso || !currentName.trim() ? contact.name : currentName,
      mobile: contact.mobile,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
              <BookUser className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Select Contact</h3>
              <p className="text-xs text-slate-500 mt-0.5">Choose phone number from device or ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200/70 border border-slate-200 text-slate-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action / Search Area */}
        <div className="p-4 space-y-3 border-b border-slate-100 bg-white">
          {/* Device Contacts Option */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-emerald-950">Phone Address Book</span>
                  {isDeviceContactsSupported ? (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                      Available
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      Mobile Only
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-800 truncate mt-0.5">
                  {isDeviceContactsSupported
                    ? 'Import directly from your smartphone contacts'
                    : 'Supported on mobile Chrome (Android) and iOS Safari'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePickFromDevice}
              disabled={isPickingDeviceContact}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 shadow-2xs ${
                isDeviceContactsSupported
                  ? 'bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white'
                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isPickingDeviceContact ? 'Opening...' : 'Open Contacts'}</span>
            </button>
          </div>

          {/* Feedback message if any */}
          {errorMessage && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-amber-700 hover:text-amber-900 font-bold ml-1"
              >
                ×
              </button>
            </div>
          )}

          {/* Search input for saved contacts */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search saved contacts by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs font-medium text-slate-800"
            />
          </div>

          {/* Name Sync Toggle Option */}
          <label className="flex items-center gap-2 cursor-pointer pt-0.5 select-none text-[11px] text-slate-600 font-medium">
            <input
              type="checkbox"
              checked={updateNameAlso}
              onChange={(e) => setUpdateNameAlso(e.target.checked)}
              className="w-3.5 h-3.5 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500"
            />
            <span>Also update person name to match selected contact</span>
          </label>
        </div>

        {/* Saved Contacts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 divide-y divide-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
            <span>Saved Ledger Contacts ({filteredContacts.length})</span>
            {currentMobile && <span className="font-normal lowercase">Current: {currentMobile}</span>}
          </div>

          {filteredContacts.length === 0 ? (
            <div className="py-8 text-center px-4">
              <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No matching contacts found</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? `No contacts matching "${searchQuery}". Try a different name or phone number.`
                  : 'No contacts with phone numbers saved yet in your ledger. Type a phone number to save it automatically with this transaction.'}
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isCurrent = currentMobile && contact.mobile.replace(/\s+/g, '') === currentMobile.replace(/\s+/g, '');
              const initials = contact.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'C';

              return (
                <button
                  key={`${contact.name}-${contact.mobile}`}
                  type="button"
                  onClick={() => handleSelectSaved(contact)}
                  className={`w-full text-left p-2.5 rounded-2xl transition flex items-center justify-between gap-3 group ${
                    isCurrent
                      ? 'bg-emerald-50/80 border border-emerald-300'
                      : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCurrent ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-800'
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{contact.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="font-mono text-slate-700 font-medium">{contact.mobile}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {contact.unpaid && contact.unpaid > 0 ? (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                        {formatINR(contact.unpaid)}
                      </span>
                    ) : null}
                    <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-400 flex items-center justify-center transition">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-4">
          <span>Tap any contact to select phone number</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
