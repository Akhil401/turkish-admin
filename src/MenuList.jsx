import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { toast } from 'react-hot-toast';
import { colors, shadows } from './theme';
import { t } from './translations';
import LogoSpinner from './components/LogoSpinner';

// Icons
const Icons = {
    Search: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    Plus: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    ),
    Edit: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
    ),
    Trash: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    ),
    Check: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    X: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    Image: () => (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    Upload: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
    ),
    Tag: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
    )
};

function MenuList() {
    const [menuItems, setMenuItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [formData, setFormData] = useState({
        Type: '',
        description: '',
        imageUrl: '',
        isAvailable: true,
        name: '',
        price: '',
        toppings: '',
        offerPrice: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Get unique categories
    const categories = [t('allCategories'), ...new Set(menuItems.map(item => item.Type).filter(Boolean))];

    useEffect(() => {
        fetchMenuItems();
    }, []);

    useEffect(() => {
        let filtered = menuItems;

        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedCategory !== 'All') {
            filtered = filtered.filter(item => item.Type === selectedCategory);
        }

        setFilteredItems(filtered);
    }, [searchTerm, selectedCategory, menuItems]);

    const fetchMenuItems = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformed = data?.map(item => ({
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                Type: item.type,
                imageUrl: item.image_url,
                isAvailable: item.is_available,
                toppings: item.toppings || [],
                offerPrice: item.offer_price
            })) || [];

            setMenuItems(transformed);
            setFilteredItems(transformed);
        } catch (error) {
            console.error('Error fetching menu items:', error);
            toast.error(t('itemDeleted'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrEdit = async () => {
        try {
            const toppingsArray = formData.toppings
                .split(',')
                .map(item => item.trim())
                .filter(item => item);
            const dataToSave = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price) || 0,
                type: formData.Type,
                image_url: formData.imageUrl,
                is_available: formData.isAvailable,
                toppings: toppingsArray,
                offer_price: formData.offerPrice ? parseFloat(formData.offerPrice) : null
            };
            if (editingId) {
                const { error } = await supabase
                    .from('menu_items')
                    .update(dataToSave)
                    .eq('id', editingId);
                if (error) throw error;
                toast.success(t('itemUpdated'));
            } else {
                const { error } = await supabase
                    .from('menu_items')
                    .insert([dataToSave]);
                if (error) throw error;
                toast.success(t('itemAdded'));
            }
            closeModal();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const toggleAvailability = async (id, current) => {
        try {
            const { error } = await supabase
                .from('menu_items')
                .update({ is_available: !current })
                .eq('id', id);
            if (error) throw error;
            toast.success(t('itemDisabled'));
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('confirmDelete'))) return;
        try {
            const { error } = await supabase
                .from('menu_items')
                .delete()
                .eq('id', id);
            if (error) throw error;
            toast.success(t('itemDeleted'));
        } catch (error) {
            toast.error(error.message);
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditingId(item.id);
            setFormData({
                ...item,
                toppings: item.toppings?.join(', ') || '',
                offerPrice: item.offerPrice || ''
            });
        } else {
            setEditingId(null);
            setFormData({
                Type: '',
                description: '',
                imageUrl: '',
                isAvailable: true,
                name: '',
                price: '',
                toppings: '',
                offerPrice: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
            Type: '',
            description: '',
            imageUrl: '',
            isAvailable: true,
            name: '',
            price: '',
            toppings: '',
            offerPrice: ''
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error(t('invalidFileType'));
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error(t('uploadFailed'));
            return;
        }

        setUploadingImage(true);
        try {
            // Create unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `menu-items/${fileName}`;

            // Upload to Supabase Storage
            const { error } = await supabase.storage
                .from('menu-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('menu-images')
                .getPublicUrl(filePath);

            setFormData({ ...formData, imageUrl: publicUrl });
            toast.success('Image uploaded successfully!');
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image: ' + error.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const InputField = ({ label, value, onChange, type = 'text', placeholder, required }) => (
        <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                {label} {required && <span style={{ color: colors.danger }}>*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none"
                style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                    boxShadow: shadows.sm
                }}
                onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                }}
                onBlur={(e) => {
                    e.target.style.borderColor = colors.border;
                    e.target.style.boxShadow = shadows.sm;
                }}
            />
        </div>
    );

    const TextAreaField = ({ label, value, onChange, placeholder }) => (
        <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                {t(label)}
            </label>
            <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none resize-none"
                style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                    boxShadow: shadows.sm
                }}
                onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                }}
                onBlur={(e) => {
                    e.target.style.borderColor = colors.border;
                    e.target.style.boxShadow = shadows.sm;
                }}
            />
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LogoSpinner />
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-stretch space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.text }}>
                        {t('menuManagement')}
                    </h1>
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                        {filteredItems.length} {t('items')} · {categories.length - 1} {t('categories')}
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold transition-all duration-200 active:scale-95"
                    style={{
                        backgroundColor: colors.primary,
                        color: colors.textInverse,
                        boxShadow: shadows.md
                    }}
                >
                    <Icons.Plus />
                    <span className="hidden xs:inline">{t('addNewItem')}</span>
                    <span className="inline xs:hidden">{t('add')}</span>
                </button>
            </div>

            {/* Search & Filters */}
            <div
                className="p-3 md:p-4 rounded-2xl flex flex-col gap-4"
                style={{ backgroundColor: colors.card, boxShadow: shadows.md }}
            >
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }}>
                        <Icons.Search />
                    </div>
                    <input
                        type="text"
                        placeholder={t('searchMenuItems')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none text-sm md:text-base"
                        style={{
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.text
                        }}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className="px-3 py-1.5 rounded-xl font-medium text-xs whitespace-nowrap transition-all border"
                            style={{
                                backgroundColor: selectedCategory === category ? colors.primary : 'transparent',
                                color: selectedCategory === category ? colors.textInverse : colors.text,
                                borderColor: selectedCategory === category ? colors.primary : colors.border
                            }}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Grid */}
            {filteredItems.length === 0 ? (
                <div
                    className="text-center py-16 rounded-2xl"
                    style={{ backgroundColor: colors.card, boxShadow: shadows.md }}
                >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.background }}>
                        <Icons.Image />
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
                        {t('noItemsFound')}
                    </h3>
                    <p style={{ color: colors.textMuted }}>
                        {searchTerm ? t('adjustSearch') : t('startAdding')}
                    </p>
                </div>
            ) : (
                <div className="w-full space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className="w-full rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02]"
                            style={{ backgroundColor: colors.card, boxShadow: shadows.md }}
                        >
                            {/* Image */}
                            <div className="relative h-48 overflow-hidden" style={{ backgroundColor: colors.background }}>
                                {item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="absolute inset-0 flex items-center justify-center"
                                    style={{ display: item.imageUrl ? 'none' : 'flex', backgroundColor: colors.background }}
                                >
                                    <Icons.Image />
                                </div>

                                {/* Availability Badge */}
                                <div
                                    className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium"
                                    style={{
                                        backgroundColor: item.isAvailable ? `${colors.success}20` : `${colors.danger}20`,
                                        color: item.isAvailable ? colors.success : colors.danger
                                    }}
                                >
                                    {item.isAvailable ? 'Available' : 'Unavailable'}
                                </div>

                                {/* Type Badge */}
                                {item.Type && (
                                    <div
                                        className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                                        style={{
                                            backgroundColor: `${colors.primary}90`,
                                            color: colors.textInverse
                                        }}
                                    >
                                        <Icons.Tag />
                                        {item.Type}
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4 md:p-5">
                                <h3 className="font-bold text-lg mb-1" style={{ color: colors.text }}>
                                    {item.name}
                                </h3>
                                <p className="text-sm mb-3 line-clamp-2" style={{ color: colors.textLight }}>
                                    {item.description || 'No description'}
                                </p>

                                {/* Price */}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-xl font-bold" style={{ color: colors.primary }}>
                                        €{item.price?.toFixed(2)}
                                    </span>
                                    {item.offerPrice && (
                                        <span className="text-sm line-through" style={{ color: colors.textMuted }}>
                                            €{item.offerPrice?.toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                {/* Toppings */}
                                {item.toppings?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {item.toppings.slice(0, 3).map((topping, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 rounded-md text-xs"
                                                style={{
                                                    backgroundColor: colors.background,
                                                    color: colors.textLight
                                                }}
                                            >
                                                {topping}
                                            </span>
                                        ))}
                                        {item.toppings.length > 3 && (
                                            <span
                                                className="px-2 py-1 rounded-md text-xs"
                                                style={{ backgroundColor: colors.background, color: colors.textMuted }}
                                            >
                                                +{item.toppings.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-1.5">
                                    <div className="flex flex-1 gap-1.5">
                                        <button
                                            onClick={() => openModal(item)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all bg-gray-50 hover:bg-gray-100"
                                            style={{ color: colors.text }}
                                        >
                                            <Icons.Edit />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => toggleAvailability(item.id, item.isAvailable)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all"
                                            style={{
                                                backgroundColor: item.isAvailable ? `${colors.warning}15` : `${colors.success}15`,
                                                color: item.isAvailable ? colors.warning : colors.success
                                            }}
                                        >
                                            {item.isAvailable ? <Icons.X /> : <Icons.Check />}
                                            {item.isAvailable ? 'Unavailable' : 'Available'}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="w-full sm:w-auto p-2 rounded-xl transition-all flex items-center justify-center"
                                        style={{ backgroundColor: `${colors.danger}15`, color: colors.danger }}
                                    >
                                        <Icons.Trash />
                                        <span className="sm:hidden ml-1.5 font-bold text-xs">Delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div
                        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6"
                        style={{ backgroundColor: colors.card, boxShadow: shadows.xl }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
                                {editingId ? 'Edit Item' : 'Add New Item'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-xl transition-colors"
                                style={{ color: colors.textLight }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = colors.background}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                                <Icons.X />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <InputField
                                label="Item Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Margherita Pizza"
                                required
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <InputField
                                    label="Price (€)"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0.00"
                                    required
                                />
                                <InputField
                                    label="Offer Price (€)"
                                    type="number"
                                    value={formData.offerPrice}
                                    onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                                    placeholder="Optional"
                                />
                            </div>

                            <InputField
                                label="Category/Type"
                                value={formData.Type}
                                onChange={(e) => setFormData({ ...formData, Type: e.target.value })}
                                placeholder="e.g., Pizza, Burger, Salad"
                            />

                            <TextAreaField
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe the item..."
                            />

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium" style={{ color: colors.text }}>
                                    Item Image
                                </label>

                                {/* Preview */}
                                {formData.imageUrl && (
                                    <div className="relative h-32 rounded-xl overflow-hidden" style={{ backgroundColor: colors.background }}>
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                            className="absolute top-2 right-2 p-1.5 rounded-lg"
                                            style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
                                        >
                                            <Icons.X />
                                        </button>
                                    </div>
                                )}

                                {/* Upload Area */}
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <div
                                        className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-all"
                                        style={{
                                            borderColor: uploadingImage ? colors.border : colors.primary,
                                            backgroundColor: uploadingImage ? colors.background : `${colors.primary}08`
                                        }}
                                    >
                                        {uploadingImage ? (
                                            <>
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: colors.primary }} />
                                                <span className="text-sm" style={{ color: colors.textMuted }}>Uploading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ color: colors.primary }}>
                                                    <Icons.Upload />
                                                </div>
                                                <span className="text-sm font-medium" style={{ color: colors.text }}>
                                                    Click to upload image
                                                </span>
                                                <span className="text-xs" style={{ color: colors.textMuted }}>
                                                    PNG, JPG up to 5MB
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Manual URL Input as fallback */}
                                <div className="flex items-center gap-2 pt-2">
                                    <span className="text-xs" style={{ color: colors.textMuted }}>Or paste URL:</span>
                                    <input
                                        type="text"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        placeholder="https://..."
                                        className="flex-1 px-3 py-1.5 rounded-lg text-sm border"
                                        style={{
                                            backgroundColor: colors.background,
                                            borderColor: colors.border,
                                            color: colors.text
                                        }}
                                    />
                                </div>
                            </div>

                            <InputField
                                label="Toppings (comma-separated)"
                                value={formData.toppings}
                                onChange={(e) => setFormData({ ...formData, toppings: e.target.value })}
                                placeholder="Cheese, Pepperoni, Mushrooms"
                            />

                            <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ backgroundColor: colors.background }}>
                                <input
                                    type="checkbox"
                                    checked={formData.isAvailable}
                                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                    className="w-5 h-5 rounded"
                                    style={{ accentColor: colors.primary }}
                                />
                                <span style={{ color: colors.text }}>Item is available for order</span>
                            </label>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={closeModal}
                                    className="flex-1 py-3 rounded-xl font-medium transition-all"
                                    style={{ backgroundColor: colors.background, color: colors.text }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddOrEdit}
                                    className="flex-1 py-3 rounded-xl font-medium transition-all"
                                    style={{
                                        backgroundColor: colors.primary,
                                        color: colors.textInverse,
                                        boxShadow: shadows.md
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = colors.primaryHover}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = colors.primary}
                                >
                                    {editingId ? 'Save Changes' : 'Add Item'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MenuList;
