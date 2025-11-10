/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'whatsapp-background': '#f0f2f5',
        'whatsapp-sidebar': '#ffffff',
        'whatsapp-chat-background': '#e5ddd5',
        'whatsapp-header': '#f0f2f5',
        'whatsapp-incoming-bubble': '#ffffff',
        'whatsapp-outgoing-bubble': '#dcf8c6',
        'whatsapp-primary-strong': '#005c4b',
        'whatsapp-primary-accent': '#00a884',
        'whatsapp-text-primary': '#111b21',
        'whatsapp-text-secondary': '#667781',
        'whatsapp-border': '#e9edef',
      },
    },
  },
  plugins: [],
};