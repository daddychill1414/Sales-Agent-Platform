"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { Save, Loader2, Image as ImageIcon, FileText, Type, Shield } from 'lucide-react';

interface PlatformSettings {
    hero_heading: string;
    hero_subheading: string;
    hero_image_url: string;
    philosophy_main: string;
    privacy_policy_html: string;
    terms_service_html: string;
}

export default function SettingsEditorPage() {
    const [settings, setSettings] = useState<PlatformSettings>({
        hero_heading: '',
        hero_subheading: '',
        hero_image_url: '',
        philosophy_main: '',
        privacy_policy_html: '',
        terms_service_html: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch('/api/admin/settings');
                const data = await res.json();
                if (data.settings) {
                    setSettings(data.settings);
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Settings saved successfully.' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save settings.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 pb-32">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Platform Settings</h1>
                        <p className="text-white/50 text-sm font-light">
                            Manage the public-facing text, imagery, and legal documents for the website.
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary py-2.5 px-6 flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>

                {message.text && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl mb-8 border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                    >
                        {message.text}
                    </motion.div>
                )}

                <div className="space-y-4">
                    {/* Hero Section Copy */}
                    <motion.div variants={fadeInUp} className="glass-panel p-8 rounded-2xl border border-white/5">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                            <Type className="w-5 h-5 text-accent" /> Homepage Hero
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest font-mono mb-2">Main Heading</label>
                                <input
                                    type="text"
                                    value={settings.hero_heading}
                                    onChange={(e) => setSettings({ ...settings, hero_heading: e.target.value })}
                                    className="w-full bg-[#0D0D12] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent text-white"
                                    placeholder="Elite Remote Sales. Zero Compromise."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest font-mono mb-2">Subheading</label>
                                <textarea
                                    value={settings.hero_subheading}
                                    onChange={(e) => setSettings({ ...settings, hero_subheading: e.target.value })}
                                    rows={3}
                                    className="w-full bg-[#0D0D12] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent text-white resize-none"
                                    placeholder="Join the top 1% of distributed agents..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest font-mono mb-2 flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" /> Background Texture Image URL
                                </label>
                                <input
                                    type="text"
                                    value={settings.hero_image_url}
                                    onChange={(e) => setSettings({ ...settings, hero_image_url: e.target.value })}
                                    className="w-full bg-[#0D0D12] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent text-white font-mono text-xs"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Philosophy Section */}
                    <motion.div variants={fadeInUp} className="glass-panel p-8 rounded-2xl border border-white/5">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                            <FileText className="w-5 h-5 text-accent" /> Philosophy Quote
                        </h2>

                        <div>
                            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest font-mono mb-2">Main Quote</label>
                            <textarea
                                value={settings.philosophy_main}
                                onChange={(e) => setSettings({ ...settings, philosophy_main: e.target.value })}
                                rows={3}
                                className="w-full bg-[#0D0D12] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent text-white resize-none"
                            />
                        </div>
                    </motion.div>

                    {/* Legal Pages */}
                    <motion.div variants={fadeInUp} className="glass-panel p-8 rounded-2xl border border-white/5">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                            <Shield className="w-5 h-5 text-accent" /> Legal Documents
                        </h2>

                        <div className="space-y-8">
                            <div>
                                <label className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest font-mono">Privacy Policy (HTML)</span>
                                </label>
                                <textarea
                                    value={settings.privacy_policy_html}
                                    onChange={(e) => setSettings({ ...settings, privacy_policy_html: e.target.value })}
                                    rows={10}
                                    className="w-full bg-[#0D0D12] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent text-white font-mono leading-relaxed resize-none"
                                />
                                <p className="text-xs text-white/30 mt-2 font-mono">Accepts HTML tags: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, etc.</p>
                            </div>

                            <div>
                                <label className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest font-mono">Terms of Service (HTML)</span>
                                </label>
                                <textarea
                                    value={settings.terms_service_html}
                                    onChange={(e) => setSettings({ ...settings, terms_service_html: e.target.value })}
                                    rows={10}
                                    className="w-full bg-[#0D0D12] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent text-white font-mono leading-relaxed resize-none"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
