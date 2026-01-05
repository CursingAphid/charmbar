'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'nl';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navbar
    'nav.home': 'Home',
    'nav.cart': 'Cart',
    'nav.language': 'Language',
    
    // Home page
    'home.hero.title': 'Create Your Perfect',
    'home.hero.subtitle': 'Charm Bracelet',
    'home.hero.description': 'Choose your bracelet and personalize it with beautiful charms that tell your story',
    'home.hero.button': 'Start Designing',
    'home.choose.title': 'Choose Your Bracelet',
    'home.choose.description': 'Select your perfect bracelet, then customize it with your favorite charms',
    'home.continue': 'Continue to Charms →',
    'home.inProgress': 'You are currently designing a bracelet!',
    'home.inProgressButton': 'Continue Designing →',
    'home.featured.title': 'Featured Charms',
    'home.featured.add': 'Add',
    'home.featured.added': 'Added',
    'home.howItWorks.title': 'How It Works',
    'home.howItWorks.step1.title': 'Select a Bracelet',
    'home.howItWorks.step1.description': 'Choose your favorite base chain to start your creation.',
    'home.howItWorks.step2.title': 'Select Charms',
    'home.howItWorks.step2.description': 'Add beautiful charms that tell your unique story.',
    'home.howItWorks.step3.title': 'Finish Order',
    'home.howItWorks.step3.description': 'Review your creation and proceed to checkout.',
    'home.howItWorks.step4.title': 'Shipped!',
    'home.howItWorks.step4.description': 'We will carefully package and ship your unique bracelet.',
    
    // Charms page
    'charms.title': 'Choose Your Charms',
    'charms.description': 'Select as many charms as you\'d like to personalize your',
    'charms.chooseBracelet': 'Choose your bracelet',
    'charms.search.placeholder': 'Search charms...',
    'charms.preview.title': 'Live Preview',
    'charms.preview.description': 'See how your bracelet looks with selected charms',
    'charms.preview.goldWarning': 'Note: Gold shades may vary slightly in images due to lighting, but all gold pieces are the same premium color in real life.',
    'charms.summary.bracelet': 'Bracelet:',
    'charms.summary.charms': 'charm',
    'charms.summary.charms_plural': 'charms',
    'charms.summary.total': 'Total:',
    'charms.button.add': 'Add Charms to Continue',
    'charms.button.cart': 'Add to Cart',
    'charms.noResults': 'No charms found matching your search.',
    'charms.selected': 'selected',
    'charms.limitReached': 'Maximum 7 charms allowed',
    
    // Cart
    'cart.title': 'Shopping Cart',
    'cart.empty': 'Your cart is empty',
    'cart.empty.description': 'Start adding charms to your bracelet!',
    'cart.empty.button': 'Continue Shopping',
    'cart.subtotal': 'Subtotal',
    'cart.total': 'Total',
    'cart.checkout': 'Proceed to Checkout',
    'cart.remove': 'Remove',
    
    // Checkout
    'checkout.title': 'Checkout',
    'checkout.success.title': 'Order Placed Successfully!',
    'checkout.success.description': 'Thank you for your order. We\'ll send you a confirmation email shortly.',
    'checkout.success.button': 'Continue Shopping',
  },
  nl: {
    // Navbar
    'nav.home': 'Home',
    'nav.cart': 'Winkelwagen',
    'nav.language': 'Taal',
    
    // Home page
    'home.hero.title': 'Creëer Je Perfecte',
    'home.hero.subtitle': 'Charm Armband',
    'home.hero.description': 'Kies je armband en personaliseer hem met prachtige charms die jouw verhaal vertellen',
    'home.hero.button': 'Begin Met Ontwerpen',
    'home.choose.title': 'Kies Je Armband',
    'home.choose.description': 'Selecteer je perfecte armband en personaliseer hem met je favoriete charms',
    'home.continue': 'Ga Door Naar Charms →',
    'home.inProgress': 'Je bent al bezig met het ontwerpen van een armband!',
    'home.inProgressButton': 'Verder Ontwerpen →',
    'home.featured.title': 'Uitgelichte Charms',
    'home.featured.add': 'Toevoegen',
    'home.featured.added': 'Toegevoegd',
    'home.howItWorks.title': 'Hoe Het Werkt',
    'home.howItWorks.step1.title': 'Kies een Armband',
    'home.howItWorks.step1.description': 'Kies je favoriete basisketting om je creatie te beginnen.',
    'home.howItWorks.step2.title': 'Selecteer Charms',
    'home.howItWorks.step2.description': 'Voeg prachtige charms toe die jouw unieke verhaal vertellen.',
    'home.howItWorks.step3.title': 'Rond Bestelling Af',
    'home.howItWorks.step3.description': 'Bekijk je creatie en ga door naar afrekenen.',
    'home.howItWorks.step4.title': 'Verzonden!',
    'home.howItWorks.step4.description': 'Wij verpakken en verzenden je unieke armband met zorg.',
    
    // Charms page
    'charms.title': 'Kies Je Charms',
    'charms.description': 'Selecteer zoveel charms als je wilt om je te personaliseren',
    'charms.chooseBracelet': 'Kies je armband',
    'charms.search.placeholder': 'Zoek charms...',
    'charms.preview.title': 'Live Voorbeeld',
    'charms.preview.description': 'Zie hoe je armband eruit ziet met geselecteerde charms',
    'charms.preview.goldWarning': 'Let op: Goudtinten kunnen in de afbeeldingen licht variëren door belichting, maar alle gouden onderdelen hebben in het echt exact dezelfde premium kleur.',
    'charms.summary.bracelet': 'Armband:',
    'charms.summary.charms': 'charm',
    'charms.summary.charms_plural': 'charms',
    'charms.summary.total': 'Totaal:',
    'charms.button.add': 'Voeg Charms Toe Om Door Te Gaan',
    'charms.button.cart': 'Toevoegen Aan Winkelwagen',
    'charms.noResults': 'Geen charms gevonden die overeenkomen met je zoekopdracht.',
    'charms.selected': 'geselecteerd',
    'charms.limitReached': 'Maximaal 7 charms toegestaan',
    
    // Cart
    'cart.title': 'Winkelwagen',
    'cart.empty': 'Je winkelwagen is leeg',
    'cart.empty.description': 'Begin met het toevoegen van charms aan je armband!',
    'cart.empty.button': 'Verder Winkelen',
    'cart.subtotal': 'Subtotaal',
    'cart.total': 'Totaal',
    'cart.checkout': 'Ga Naar Kassa',
    'cart.remove': 'Verwijderen',
    
    // Checkout
    'checkout.title': 'Afrekenen',
    'checkout.success.title': 'Bestelling Succesvol Geplaatst!',
    'checkout.success.description': 'Bedankt voor je bestelling. We sturen je binnenkort een bevestigingsmail.',
    'checkout.success.button': 'Verder Winkelen',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('nl'); // Default to Dutch

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

