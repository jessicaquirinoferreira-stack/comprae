import React from 'react';
import {
  Layers,
  Smartphone,
  Briefcase,
  Heart,
  Dog,
  Sparkles,
  UtensilsCrossed,
  Gamepad2
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

const CATEGORIES = [
  { name: 'Todos', icon: Layers },
  { name: 'Tech & Gadgets', icon: Smartphone },
  { name: 'Office & Organization', icon: Briefcase },
  { name: 'Beauty & Health', icon: Heart },
  { name: 'Pet Supplies', icon: Dog },
  { name: 'Accessories', icon: Sparkles },
  { name: 'Home & Kitchen', icon: UtensilsCrossed },
  { name: 'Kids & Toys', icon: Gamepad2 }
];

export const CategoryPills: React.FC = () => {
  const { selectedCategory, setSelectedCategory, products } = useStore();

  const getCount = (catName: string) => {
    if (catName === 'Todos') return products.length;
    return products.filter((p) => p.category === catName).length;
  };

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-none">
      <div className="flex items-center gap-2 sm:gap-3 min-w-max">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.name;
          const count = getCount(cat.name);

          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
