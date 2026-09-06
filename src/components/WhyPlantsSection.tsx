import { motion } from "framer-motion";
import { Heart, Wind, Brain, Smile } from "lucide-react";

const reasons = [
  {
    icon: Wind,
    title: "Purify Your Air",
    desc: "Plants naturally filter toxins and produce fresh oxygen, making your home healthier.",
  },
  {
    icon: Brain,
    title: "Boost Productivity",
    desc: "Studies show plants increase focus and creativity by up to 15%. Your green desk buddy awaits.",
  },
  {
    icon: Heart,
    title: "Reduce Stress",
    desc: "Caring for plants lowers cortisol levels and promotes mindfulness in your daily routine.",
  },
  {
    icon: Smile,
    title: "Elevate Your Space",
    desc: "Plants add life, color, and personality to any room — the easiest home upgrade that grows.",
  },
];

const WhyPlantsSection = () => {
  return (
    <section id="about" className="py-24 bg-secondary">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-leaf font-semibold text-sm uppercase tracking-widest">Why Go Green?</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">
            Plants Change Everything
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            More than decoration — plants are scientifically proven to improve your health, mood, and quality of life.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-popover rounded-2xl p-8 shadow-plant transition-shadow hover:shadow-lg group cursor-default"
            >
              <div className="w-14 h-14 rounded-xl bg-leaf/10 flex items-center justify-center mb-5 group-hover:bg-leaf/20 transition-colors">
                <reason.icon className="text-leaf" size={28} />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">{reason.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{reason.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyPlantsSection;
