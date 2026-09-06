import logo from "@/assets/logo.png";
import { Leaf } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-leaf-dark py-16">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Grow Green" className="h-10 w-10" />
              <span className="font-display text-xl font-bold text-cream">Grow Green</span>
            </div>
            <p className="text-cream/60 text-sm leading-relaxed">
              Bringing nature closer to you, one plant at a time. Sustainably grown, lovingly curated, delivered to your door.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {[
              { title: "Shop", links: ["Indoor Plants", "Outdoor Plants", "Succulents", "Herbs"] },
              { title: "Company", links: ["About Us", "Contact", "Careers", "Blog"] },
              { title: "Support", links: ["FAQs", "Shipping", "Returns", "Plant Care"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-display font-bold text-cream mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-cream/50 hover:text-cream transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-cream/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-cream/40 text-sm">© 2026 Grow Green. All rights reserved.</p>
          <div className="flex items-center gap-1 text-cream/40 text-sm">
            <span>Made with</span>
            <Leaf size={14} className="text-leaf-light" />
            <span>and love</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
