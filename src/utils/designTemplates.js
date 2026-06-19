/**
 * Rich, professional default Canva-style templates for 10 distinct business niches.
 * Each template includes modern shapes, shadows, gradients, badges, and image frames.
 */

const TEMPLATES = {
  restaurant_offer: {
    canvas: { width: 1080, height: 1080, backgroundColor: '#FFF7ED' },
    theme: { primaryColor: '#EA580C', secondaryColor: '#FDBA74', accentColor: '#1E293B', fontFamily: 'Poppins' },
    layers: [
      { id: 'bg', type: 'gradient_rect', x: 0, y: 0, width: 1080, height: 1080, fill: ['#FFF7ED', '#FED7AA'], gradientDirection: 'vertical', locked: true, editable: false, zIndex: 0 },
      { id: 'circle_top', type: 'circle', x: 880, y: -50, width: 300, height: 300, fill: '#FDBA74', opacity: 0.5, editable: true, zIndex: 1 },
      { id: 'blob_left', type: 'blob', x: -100, y: 600, width: 350, height: 350, fill: '#EA580C', opacity: 0.15, editable: true, zIndex: 2 },
      { id: 'image_frame', type: 'rect', x: 120, y: 120, width: 840, height: 460, fill: '#FFFFFF', cornerRadius: 36, shadowColor: '#000000', shadowBlur: 20, shadowOpacity: 0.15, shadowOffsetY: 8, editable: true, zIndex: 3 },
      { id: 'image', type: 'image_placeholder', x: 140, y: 140, width: 800, height: 420, cornerRadius: 28, placeholderText: 'Upload Delicious Dish Photo', imageUrl: null, fit: 'cover', editable: true, zIndex: 4 },
      { id: 'badge', type: 'badge', x: 720, y: 490, width: 220, height: 80, fill: '#DC2626', text: '50% OFF', textColor: '#FFFFFF', fontSize: 32, fontFamily: 'Poppins', fontStyle: 'bold', cornerRadius: 40, rotation: -6, shadowBlur: 10, shadowOpacity: 0.2, editable: true, zIndex: 5 },
      { id: 'headline', type: 'text', x: 80, y: 640, width: 920, height: 120, text: 'WEEKEND FEAST OFFER', fontSize: 62, fontFamily: 'Poppins', fontStyle: 'bold', fill: '#1E293B', align: 'center', editable: true, zIndex: 6 },
      { id: 'subheadline', type: 'text', x: 120, y: 760, width: 840, height: 80, text: 'Savor the best local flavors with special discounts this Sunday.', fontSize: 30, fontFamily: 'Poppins', fill: '#475569', align: 'center', editable: true, zIndex: 7 },
      { id: 'cta', type: 'button', x: 340, y: 880, width: 400, height: 86, fill: '#EA580C', text: 'Order Delivery', textColor: '#FFFFFF', fontSize: 32, fontFamily: 'Poppins', fontStyle: 'bold', cornerRadius: 43, shadowBlur: 12, shadowOpacity: 0.2, editable: true, zIndex: 8 },
      { id: 'footer', type: 'text', x: 140, y: 990, width: 800, height: 40, text: 'T&C Apply | Call 1800-FOOD-BITE', fontSize: 24, fontFamily: 'Poppins', fill: '#64748B', align: 'center', editable: true, zIndex: 9 }
    ]
  },

  hotel_booking: {
    canvas: { width: 1080, height: 1080, backgroundColor: '#F8FAFC' },
    theme: { primaryColor: '#0F172A', secondaryColor: '#94A3B8', accentColor: '#D97706', fontFamily: 'Montserrat' },
    layers: [
      { id: 'bg', type: 'gradient_rect', x: 0, y: 0, width: 1080, height: 1080, fill: ['#F8FAFC', '#E2E8F0'], gradientDirection: 'vertical', locked: true, editable: false, zIndex: 0 },
      { id: 'wave_top', type: 'wave', x: 0, y: -20, width: 1080, height: 180, fill: '#94A3B8', opacity: 0.2, editable: true, zIndex: 1 },
      { id: 'image_frame', type: 'rect', x: 100, y: 140, width: 880, height: 480, fill: '#FFFFFF', cornerRadius: 16, shadowColor: '#000000', shadowBlur: 24, shadowOpacity: 0.12, shadowOffsetY: 12, editable: true, zIndex: 2 },
      { id: 'image', type: 'image_placeholder', x: 120, y: 160, width: 840, height: 440, cornerRadius: 8, placeholderText: 'Upload Luxury Suite Photo', imageUrl: null, fit: 'cover', editable: true, zIndex: 3 },
      { id: 'badge', type: 'badge', x: 140, y: 180, width: 240, height: 70, fill: '#D97706', text: 'LUXURY STAY', textColor: '#FFFFFF', fontSize: 24, fontFamily: 'Montserrat', fontStyle: 'bold', cornerRadius: 4, rotation: 0, editable: true, zIndex: 4 },
      { id: 'headline', type: 'text', x: 80, y: 670, width: 920, height: 110, text: 'FIND YOUR PERFECT ESCAPE', fontSize: 58, fontFamily: 'Montserrat', fontStyle: 'bold', fill: '#0F172A', align: 'center', editable: true, zIndex: 5 },
      { id: 'subheadline', type: 'text', x: 100, y: 785, width: 880, height: 80, text: 'Book today and enjoy up to 30% off on all premium resort bookings.', fontSize: 28, fontFamily: 'Montserrat', fill: '#334155', align: 'center', editable: true, zIndex: 6 },
      { id: 'cta', type: 'button', x: 360, y: 890, width: 360, height: 80, fill: '#0F172A', text: 'Book Suite', textColor: '#FFFFFF', fontSize: 28, fontFamily: 'Montserrat', fontStyle: 'bold', cornerRadius: 8, shadowBlur: 10, shadowOpacity: 0.25, editable: true, zIndex: 7 },
      { id: 'footer', type: 'text', x: 140, y: 1000, width: 800, height: 40, text: 'www.escapehaven.com | Spa & Pool Included', fontSize: 22, fontFamily: 'Montserrat', fill: '#64748B', align: 'center', editable: true, zIndex: 8 }
    ]
  },

  clinic_health: {
    canvas: { width: 1080, height: 1080, backgroundColor: '#F0FDFA' },
    theme: { primaryColor: '#0D9488', secondaryColor: '#99F6E4', accentColor: '#1E293B', fontFamily: 'Outfit' },
    layers: [
      { id: 'bg', type: 'gradient_rect', x: 0, y: 0, width: 1080, height: 1080, fill: ['#F0FDFA', '#CCFBF1'], gradientDirection: 'vertical', locked: true, editable: false, zIndex: 0 },
      { id: 'blob_right', type: 'blob', x: 750, y: 350, width: 400, height: 400, fill: '#99F6E4', opacity: 0.3, editable: true, zIndex: 1 },
      { id: 'image_frame', type: 'rect', x: 130, y: 120, width: 820, height: 440, fill: '#FFFFFF', cornerRadius: 40, stroke: '#0D9488', strokeWidth: 3, shadowColor: '#000000', shadowBlur: 18, shadowOpacity: 0.1, shadowOffsetY: 6, editable: true, zIndex: 2 },
      { id: 'image', type: 'image_placeholder', x: 150, y: 140, width: 780, height: 400, cornerRadius: 32, placeholderText: 'Upload Clinic / Doctor Image', imageUrl: null, fit: 'cover', editable: true, zIndex: 3 },
      { id: 'badge', type: 'badge', x: 700, y: 470, width: 220, height: 76, fill: '#0F766E', text: 'FREE CHECKUP', textColor: '#FFFFFF', fontSize: 24, fontFamily: 'Outfit', fontStyle: 'bold', cornerRadius: 38, shadowBlur: 8, shadowOpacity: 0.15, editable: true, zIndex: 4 },
      { id: 'headline', type: 'text', x: 80, y: 610, width: 920, height: 110, text: 'COMPREHENSIVE DENTAL CARE', fontSize: 52, fontFamily: 'Outfit', fontStyle: 'bold', fill: '#1E293B', align: 'center', editable: true, zIndex: 5 },
      { id: 'subheadline', type: 'text', x: 120, y: 730, width: 840, height: 80, text: 'Keep your family smiling with professional, painless orthodontics.', fontSize: 28, fontFamily: 'Outfit', fill: '#475569', align: 'center', editable: true, zIndex: 6 },
      { id: 'cta', type: 'button', x: 350, y: 860, width: 380, height: 80, fill: '#0D9488', text: 'Schedule Appointment', textColor: '#FFFFFF', fontSize: 28, fontFamily: 'Outfit', fontStyle: 'bold', cornerRadius: 40, shadowBlur: 12, shadowOpacity: 0.15, editable: true, zIndex: 7 },
      { id: 'footer', type: 'text', x: 140, y: 980, width: 800, height: 40, text: 'Medicare Accepted | Safe & Sanitized Clinic', fontSize: 22, fontFamily: 'Outfit', fill: '#64748B', align: 'center', editable: true, zIndex: 8 }
    ]
  },

  pharmacy_discount: {
    canvas: { width: 1080, height: 1080, backgroundColor: '#F0FDF4' },
    theme: { primaryColor: '#16A34A', secondaryColor: '#86EFAC', accentColor: '#1E293B', fontFamily: 'Inter' },
    layers: [
      { id: 'bg', type: 'gradient_rect', x: 0, y: 0, width: 1080, height: 1080, fill: ['#F0FDF4', '#DCFCE7'], gradientDirection: 'vertical', locked: true, editable: false, zIndex: 0 },
      { id: 'circle_left', type: 'circle', x: -50, y: 80, width: 250, height: 250, fill: '#86EFAC', opacity: 0.4, editable: true, zIndex: 1 },
      { id: 'image_frame', type: 'rect', x: 140, y: 130, width: 800, height: 430, fill: '#FFFFFF', cornerRadius: 20, shadowColor: '#000000', shadowBlur: 15, shadowOpacity: 0.1, shadowOffsetY: 4, editable: true, zIndex: 2 },
      { id: 'image', type: 'image_placeholder', x: 160, y: 150, width: 760, height: 390, cornerRadius: 12, placeholderText: 'Upload Pharmacy Products', imageUrl: null, fit: 'cover', editable: true, zIndex: 3 },
      { id: 'badge', type: 'badge', x: 720, y: 470, width: 200, height: 76, fill: '#DC2626', text: '15% OFF', textColor: '#FFFFFF', fontSize: 28, fontFamily: 'Inter', fontStyle: 'bold', cornerRadius: 12, rotation: 5, editable: true, zIndex: 4 },
      { id: 'headline', type: 'text', x: 80, y: 600, width: 920, height: 110, text: 'YOUR HEALTH IS OUR PRIORITY', fontSize: 50, fontFamily: 'Inter', fontStyle: 'bold', fill: '#1E293B', align: 'center', editable: true, zIndex: 5 },
      { id: 'subheadline', type: 'text', x: 120, y: 710, width: 840, height: 80, text: 'Get genuine prescription medicines delivered right to your doorstep.', fontSize: 28, fontFamily: 'Inter', fill: '#475569', align: 'center', editable: true, zIndex: 6 },
      { id: 'cta', type: 'button', x: 360, y: 830, width: 360, height: 80, fill: '#16A34A', text: 'Order Medicines', textColor: '#FFFFFF', fontSize: 28, fontFamily: 'Inter', fontStyle: 'bold', cornerRadius: 10, shadowBlur: 10, shadowOpacity: 0.15, editable: true, zIndex: 7 },
      { id: 'footer', type: 'text', x: 140, y: 950, width: 800, height: 40, text: '24/7 Helpline Support | Free Home Delivery on $30+', fontSize: 22, fontFamily: 'Inter', fill: '#64748B', align: 'center', editable: true, zIndex: 8 }
    ]
  },

  salon_offer: {
    canvas: { width: 1080, height: 1080, backgroundColor: '#FFF1F2' },
    theme: { primaryColor: '#DB2777', secondaryColor: '#FBCFE8', accentColor: '#1E293B', fontFamily: 'Outfit' },
    layers: [
      { id: 'bg', type: 'gradient_rect', x: 0, y: 0, width: 1080, height: 1080, fill: ['#FFF1F2', '#FFE4E6'], gradientDirection: 'vertical', locked: true, editable: false, zIndex: 0 },
      { id: 'blob_bg', type: 'blob', x: 700, y: 50, width: 450, height: 450, fill: '#FBCFE8', opacity: 0.4, editable: true, zIndex: 1 },
      { id: 'image_frame', type: 'rect', x: 120, y: 140, width: 840, height: 440, fill: '#FFFFFF', cornerRadius: 60, shadowColor: '#000000', shadowBlur: 22, shadowOpacity: 0.12, shadowOffsetY: 10, editable: true, zIndex: 2 },
      { id: 'image', type: 'image_placeholder', x: 140, y: 160, width: 800, height: 400, cornerRadius: 48, placeholderText: 'Upload Hair / Makeover Look', imageUrl: null, fit: 'cover', editable: true, zIndex: 3 },
      { id: 'badge', type: 'badge', x: 740, y: 490, width: 180, height: 76, fill: '#DB2777', text: 'SPECIAL', textColor: '#FFFFFF', fontSize: 26, fontFamily: 'Outfit', fontStyle: 'bold', cornerRadius: 38, rotation: -12, editable: true, zIndex: 4 },
      { id: 'headline', type: 'text', x: 80, y: 630, width: 920, height: 110, text: 'GLOW UP WITH BEAUTY SALON', fontSize: 54, fontFamily: 'Outfit', fontStyle: 'bold', fill: '#1E293B', align: 'center', editable: true, zIndex: 5 },
      { id: 'subheadline', type: 'text', x: 100, y: 745, width: 880, height: 80, text: 'Indulge in premium hair spa, styling, facials, and skincare packages.', fontSize: 28, fontFamily: 'Outfit', fill: '#475569', align: 'center', editable: true, zIndex: 6 },
      { id: 'cta', type: 'button', x: 350, y: 870, width: 380, height: 80, fill: '#DB2777', text: 'Book Makeover', textColor: '#FFFFFF', fontSize: 28, fontFamily: 'Outfit', fontStyle: 'bold', cornerRadius: 40, shadowBlur: 14, shadowOpacity: 0.2, editable: true, zIndex: 7 },
      { id: 'footer', type: 'text', x: 140, y: 990, width: 800, height: 40, text: 'Prior Booking Recommended | Bridal & Party Offers Open', fontSize: 22, fontFamily: 'Outfit', fill: '#64748B', align: 'center', editable: true, zIndex: 8 }
    ]
  },

  festival_offer: {
    canvas: { width: 1080, height: 1080, backgroundColor: '#FAF5FF' },
    theme: { primaryColor: '#7C3AED', secondaryColor: '#E9D5FF', accentColor: '#D97706', fontFamily: 'Montserrat' },
    layers: [
      { id: 'bg', type: 'gradient_rect', x: 0, y: 0, width: 1080, height: 1080, fill: ['#FAF5FF', '#F3E8FF'], gradientDirection: 'vertical', locked: true, editable: false, zIndex: 0 },
      { id: 'star_top', type: 'circle', x: 900, y: 80, width: 180, height: 180, fill: '#E9D5FF', opacity: 0.6, editable: true, zIndex: 1 },
      { id: 'image_frame', type: 'rect', x: 110, y: 130, width: 860, height: 450, fill: '#FFFFFF', cornerRadius: 24, stroke: '#7C3AED', strokeWidth: 3, shadowColor: '#D97706', shadowBlur: 20, shadowOpacity: 0.15, shadowOffsetY: 6, editable: true, zIndex: 2 },
      { id: 'image', type: 'image_placeholder', x: 130, y: 150, width: 800, height: 410, cornerRadius: 16, placeholderText: 'Upload Festive Celebration Photo', imageUrl: null, fit: 'cover', editable: true, zIndex: 3 },
      { id: 'badge', type: 'badge', x: 710, y: 490, width: 230, height: 80, fill: '#D97706', text: 'FESTIVAL SALE', textColor: '#FFFFFF', fontSize: 24, fontFamily: 'Montserrat', fontStyle: 'bold', cornerRadius: 40, rotation: -5, shadowBlur: 10, shadowOpacity: 0.2, editable: true, zIndex: 4 },
      { id: 'headline', type: 'text', x: 80, y: 630, width: 920, height: 120, text: 'CELEBRATE WITH GOLDEN SAVINGS', fontSize: 56, fontFamily: 'Montserrat', fontStyle: 'bold', fill: '#7C3AED', align: 'center', editable: true, zIndex: 5 },
      { id: 'subheadline', type: 'text', x: 100, y: 755, width: 880, height: 80, text: 'Special festive deals across all product categories. Double reward points!', fontSize: 26, fontFamily: 'Montserrat', fill: '#4B5563', align: 'center', editable: true, zIndex: 6 },
      { id: 'cta', type: 'button', x: 340, y: 870, width: 400, height: 82, fill: '#7C3AED', text: 'Shop Festival Collection', textColor: '#FFFFFF', fontSize: 26, fontFamily: 'Montserrat', fontStyle: 'bold', cornerRadius: 41, shadowBlur: 12, shadowOpacity: 0.2, editable: true, zIndex: 7 },
      { id: 'footer', type: 'text', x: 140, y: 990, width: 800, height: 40, text: 'Offer Valid Till Festival Weekend | Free Shipping Across India', fontSize: 22, fontFamily: 'Montserrat', fill: '#6B7280', align: 'center', editable: true, zIndex: 8 }
    ]
  },

  real_estate: {
    canvas: { width: 1080, height: 1080, backgroundColor: '#F1F5F9' },
    theme: { primaryColor: '#0F172A', secondaryColor: '#CBD5E1', accentColor: '#2563EB', fontFamily: 'Montserrat' },
    layers: [
      { id: 'bg', type: 'gradient_rect', x: 0, y: 0, width: 1080, height: 1080, fill: ['#F1F5F9', '#E2E8F0'], gradientDirection: 'vertical', locked: true, editable: false, zIndex: 0 },
      { id: 'decor_top_bar', type: 'rect', x: 0, y: 0, width: 1080, height: 30, fill: '#2563EB', locked: true, zIndex: 1 },
      { id: 'image_frame', type: 'rect', x: 100, y: 100, width: 880, height: 480, fill: '#FFFFFF', cornerRadius: 8, shadowColor: '#000000', shadowBlur: 20, shadowOpacity: 0.15, shadowOffsetY: 10, editable: true, zIndex: 2 },
      { id: 'image', type: 'image_placeholder', x: 120, y: 120, width: 840, height: 440, cornerRadius: 4, placeholderText: 'Upload Luxury Property Photo', imageUrl: null, fit: 'cover', editable: true, zIndex: 3 },
      { id: 'badge', type: 'badge', x: 140, y: 140, width: 220, height: 70, fill: '#2563EB', text: 'FOR SALE', textColor: '#FFFFFF', fontSize: 26, fontFamily: 'Montserrat', fontStyle: 'bold', cornerRadius: 4, rotation: 0, editable: true, zIndex: 4 },
      { id: 'headline', type: 'text', x: 80, y: 640, width: 920, height: 110, text: 'PREMIUM MODERN APARTMENTS', fontSize: 54, fontFamily: 'Montserrat', fontStyle: 'bold', fill: '#0F172A', align: 'center', editable: true, zIndex: 5 },
      { id: 'subheadline', type: 'text', x: 120, y: 755, width: 840, height: 80, text: 'Spacious 3 BHK villas in prime city locations with 24/7 security & smart automation.', fontSize: 26, fontFamily: 'Montserrat', fill: '#475569', align: 'center', editable: true, zIndex: 6 },
      { id: 'cta', type: 'button', x: 360, y: 880, width: 360, height: 80, fill: '#2563EB', text: 'Inquire Price', textColor: '#FFFFFF', fontSize: 28, fontFamily: 'Montserrat', fontStyle: 'bold', cornerRadius: 6, shadowBlur: 10, shadowOpacity: 0.2, editable: true, zIndex: 7 },
      { id: 'footer', type: 'text', x: 140, y: 990, width: 800, height: 40, text: 'Book Site Visit | 0% Brokerage Charges Applied', fontSize: 22, fontFamily: 'Montserrat', fill: '#64748B', align: 'center', editable: true, zIndex: 8 }
    ]
  },

  education_course: {
    canvas: { width: 1080, height: 1080, backgroundColor: '#EFF6FF' },
    theme: { primaryColor: '#1D4ED8', secondaryColor: '#BFDBFE', accentColor: '#EF4444', fontFamily: 'Inter' },
    layers: [
      { id: 'bg', type: 'gradient_rect', x: 0, y: 0, width: 1080, height: 1080, fill: ['#EFF6FF', '#DBEAFE'], gradientDirection: 'vertical', locked: true, editable: false, zIndex: 0 },
      { id: 'blob_left', type: 'blob', x: -80, y: 400, width: 320, height: 320, fill: '#BFDBFE', opacity: 0.5, editable: true, zIndex: 1 },
      { id: 'image_frame', type: 'rect', x: 130, y: 130, width: 820, height: 430, fill: '#FFFFFF', cornerRadius: 32, shadowColor: '#000000', shadowBlur: 18, shadowOpacity: 0.1, shadowOffsetY: 6, editable: true, zIndex: 2 },
      { id: 'image', type: 'image_placeholder', x: 150, y: 150, width: 780, height: 390, cornerRadius: 24, placeholderText: 'Upload Students / Classroom Photo', imageUrl: null, fit: 'cover', editable: true, zIndex: 3 },
      { id: 'badge', type: 'badge', x: 710, y: 470, width: 220, height: 76, fill: '#EF4444', text: 'NEW BATCH', textColor: '#FFFFFF', fontSize: 24, fontFamily: 'Inter', fontStyle: 'bold', cornerRadius: 38, rotation: -6, editable: true, zIndex: 4 },
      { id: 'headline', type: 'text', x: 80, y: 610, width: 920, height: 110, text: 'ADMISSIONS OPEN FOR 2026', fontSize: 54, fontFamily: 'Inter', fontStyle: 'bold', fill: '#1D4ED8', align: 'center', editable: true, zIndex: 5 },
      { id: 'subheadline', type: 'text', x: 100, y: 725, width: 880, height: 80, text: 'Join our world-class coding and robotics programs for kids. Hands-on labs!', fontSize: 26, fontFamily: 'Inter', fill: '#4B5563', align: 'center', editable: true, zIndex: 6 },
      { id: 'cta', type: 'button', x: 350, y: 840, width: 380, height: 82, fill: '#1D4ED8', text: 'Enroll Now', textColor: '#FFFFFF', fontSize: 28, fontFamily: 'Inter', fontStyle: 'bold', cornerRadius: 41, shadowBlur: 12, shadowOpacity: 0.15, editable: true, zIndex: 7 },
      { id: 'footer', type: 'text', x: 140, y: 960, width: 800, height: 40, text: 'Limited Seats Available | Scholarships Available up to 50%', fontSize: 22, fontFamily: 'Inter', fill: '#6B7280', align: 'center', editable: true, zIndex: 8 }
    ]
  },

  gym_fitness: {
    canvas: { width: 1080, height: 1080, backgroundColor: '#090D16' },
    theme: { primaryColor: '#F59E0B', secondaryColor: '#34D399', accentColor: '#FFFFFF', fontFamily: 'Montserrat' },
    layers: [
      { id: 'bg', type: 'gradient_rect', x: 0, y: 0, width: 1080, height: 1080, fill: ['#090D16', '#1E293B'], gradientDirection: 'vertical', locked: true, editable: false, zIndex: 0 },
      { id: 'circle_glow', type: 'circle', x: 540, y: 350, width: 650, height: 650, fill: '#F59E0B', opacity: 0.08, editable: true, zIndex: 1 },
      { id: 'image_frame', type: 'rect', x: 140, y: 110, width: 800, height: 460, fill: '#1E293B', cornerRadius: 16, stroke: '#F59E0B', strokeWidth: 2, shadowColor: '#F59E0B', shadowBlur: 20, shadowOpacity: 0.1, editable: true, zIndex: 2 },
      { id: 'image', type: 'image_placeholder', x: 160, y: 130, width: 720, height: 420, cornerRadius: 8, placeholderText: 'Upload High-Energy Fitness Action Photo', imageUrl: null, fit: 'cover', editable: true, zIndex: 3 },
      { id: 'badge', type: 'badge', x: 700, y: 460, width: 220, height: 76, fill: '#10B981', text: 'JOIN TODAY', textColor: '#FFFFFF', fontSize: 26, fontFamily: 'Montserrat', fontStyle: 'bold', cornerRadius: 8, rotation: 5, editable: true, zIndex: 4 },
      { id: 'headline', type: 'text', x: 80, y: 620, width: 920, height: 110, text: 'CRUSH YOUR FITNESS GOALS', fontSize: 58, fontFamily: 'Montserrat', fontStyle: 'bold', fill: '#FFFFFF', align: 'center', editable: true, zIndex: 5 },
      { id: 'subheadline', type: 'text', x: 120, y: 735, width: 840, height: 80, text: 'Get unlimited access to premium cardio equipment, free weights, and trainers.', fontSize: 28, fontFamily: 'Montserrat', fill: '#94A3B8', align: 'center', editable: true, zIndex: 6 },
      { id: 'cta', type: 'button', x: 360, y: 860, width: 360, height: 80, fill: '#F59E0B', text: 'Start Free Trial', textColor: '#0F172A', fontSize: 28, fontFamily: 'Montserrat', fontStyle: 'bold', cornerRadius: 8, shadowBlur: 14, shadowOpacity: 0.25, editable: true, zIndex: 7 },
      { id: 'footer', type: 'text', x: 140, y: 980, width: 800, height: 40, text: 'No Joining Fees | Free Health Assessment on Sign-up', fontSize: 22, fontFamily: 'Montserrat', fill: '#64748B', align: 'center', editable: true, zIndex: 8 }
    ]
  },

  bakery_offer: {
    canvas: { width: 1080, height: 1080, backgroundColor: '#FFFDF5' },
    theme: { primaryColor: '#D97706', secondaryColor: '#FDE68A', accentColor: '#1E293B', fontFamily: 'Poppins' },
    layers: [
      { id: 'bg', type: 'gradient_rect', x: 0, y: 0, width: 1080, height: 1080, fill: ['#FFFDF5', '#FEF3C7'], gradientDirection: 'vertical', locked: true, editable: false, zIndex: 0 },
      { id: 'blob_bg', type: 'blob', x: 740, y: 600, width: 340, height: 340, fill: '#FDE68A', opacity: 0.4, editable: true, zIndex: 1 },
      { id: 'image_frame', type: 'rect', x: 120, y: 130, width: 840, height: 450, fill: '#FFFFFF', cornerRadius: 40, shadowColor: '#D97706', shadowBlur: 20, shadowOpacity: 0.1, shadowOffsetY: 6, editable: true, zIndex: 2 },
      { id: 'image', type: 'image_placeholder', x: 140, y: 150, width: 800, height: 410, cornerRadius: 32, placeholderText: 'Upload Freshly Baked Cake Photo', imageUrl: null, fit: 'cover', editable: true, zIndex: 3 },
      { id: 'badge', type: 'badge', x: 720, y: 480, width: 220, height: 80, fill: '#B45309', text: 'FRESH BATCH', textColor: '#FFFFFF', fontSize: 24, fontFamily: 'Poppins', fontStyle: 'bold', cornerRadius: 40, rotation: -5, shadowBlur: 10, shadowOpacity: 0.2, editable: true, zIndex: 4 },
      { id: 'headline', type: 'text', x: 80, y: 630, width: 920, height: 120, text: 'SWEET TREATS FOR EVERY DAY', fontSize: 56, fontFamily: 'Poppins', fontStyle: 'bold', fill: '#1E293B', align: 'center', editable: true, zIndex: 5 },
      { id: 'subheadline', type: 'text', x: 100, y: 755, width: 880, height: 80, text: 'Custom birthday cakes, fresh pastries, artisan breads, and savory buns.', fontSize: 28, fontFamily: 'Poppins', fill: '#4B5563', align: 'center', editable: true, zIndex: 6 },
      { id: 'cta', type: 'button', x: 350, y: 870, width: 380, height: 82, fill: '#D97706', text: 'Pre-Order Cake', textColor: '#FFFFFF', fontSize: 28, fontFamily: 'Poppins', fontStyle: 'bold', cornerRadius: 41, shadowBlur: 12, shadowOpacity: 0.18, editable: true, zIndex: 7 },
      { id: 'footer', type: 'text', x: 140, y: 990, width: 800, height: 40, text: 'Eggless Options Available | Order 24 Hours in Advance', fontSize: 22, fontFamily: 'Poppins', fill: '#6B7280', align: 'center', editable: true, zIndex: 8 }
    ]
  }
};

/**
 * Main helper to resolve template based on category mapping.
 */
export function getDefaultPosterTemplate(businessType = 'Business', goal = 'Special Offer') {
  const norm = businessType.toLowerCase();

  let key = 'restaurant_offer'; // Default fallback
  
  if (norm.includes('hotel') || norm.includes('stay') || norm.includes('resort') || norm.includes('travel') || norm.includes('room')) {
    key = 'hotel_booking';
  } else if (norm.includes('dent') || norm.includes('ortho') || norm.includes('clinic') || norm.includes('doctor') || norm.includes('physio')) {
    key = 'clinic_health';
  } else if (norm.includes('pharm') || norm.includes('medicine') || norm.includes('drug')) {
    key = 'pharmacy_discount';
  } else if (norm.includes('salon') || norm.includes('beauty') || norm.includes('hair') || norm.includes('spa') || norm.includes('makeup')) {
    key = 'salon_offer';
  } else if (norm.includes('fit') || norm.includes('gym') || norm.includes('train') || norm.includes('sport') || norm.includes('workout')) {
    key = 'gym_fitness';
  } else if (norm.includes('school') || norm.includes('college') || norm.includes('learn') || norm.includes('educat') || norm.includes('course') || norm.includes('class')) {
    key = 'education_course';
  } else if (norm.includes('real') || norm.includes('estate') || norm.includes('house') || norm.includes('home') || norm.includes('property')) {
    key = 'real_estate';
  } else if (norm.includes('diwali') || norm.includes('festival') || norm.includes('holiday') || norm.includes('sale') || norm.includes('pongal')) {
    key = 'festival_offer';
  } else if (norm.includes('bake') || norm.includes('cake') || norm.includes('pastry') || norm.includes('bread') || norm.includes('sweet')) {
    key = 'bakery_offer';
  } else if (norm.includes('food') || norm.includes('rest') || norm.includes('cafe') || norm.includes('biryani') || norm.includes('kitchen')) {
    key = 'restaurant_offer';
  }

  const selectedTemplate = TEMPLATES[key];

  // Set the specific task goal in the headline layer
  const updatedLayers = selectedTemplate.layers.map(layer => {
    if (layer.id === 'headline') {
      return { ...layer, text: goal.toUpperCase() };
    }
    return layer;
  });

  return {
    ...selectedTemplate,
    layers: updatedLayers
  };
}
export default getDefaultPosterTemplate;
