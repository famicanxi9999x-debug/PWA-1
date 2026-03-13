import React from "react"
import { motion } from "framer-motion"
import { useApp } from "../store"
import { AnimatedGradient } from "./ui/animated-gradient-with-svg"

import { Share2 } from "lucide-react"

interface BentoCardProps {
  title: string
  value: string | number
  subtitle?: string
  colors: string[]
  delay: number
  onShare?: () => void
}

const BentoCard: React.FC<BentoCardProps> = ({
  title,
  value,
  subtitle,
  colors,
  delay,
  onShare,
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay + 0.3,
      },
    },
  }

  const item = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.5 } },
  }

  return (
    <motion.div
      className="relative overflow-hidden h-full bg-white/5 border border-white/5 rounded-3xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <AnimatedGradient colors={colors} speed={0.05} blur="medium" />
      <motion.div
        className="relative z-10 p-5 sm:p-6 md:p-8 h-full flex flex-col justify-between backdrop-blur-sm"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="flex justify-between items-start">
            <div>
                <motion.h3 
                className="text-sm sm:text-base font-semibold text-white/60 uppercase tracking-wide" 
                variants={item}
                >
                {title}
                </motion.h3>
                <motion.p
                className="text-3xl sm:text-4xl md:text-5xl font-bold mt-2 text-white"
                variants={item}
                >
                {value}
                </motion.p>
            </div>
            {onShare && (
              <motion.button
                variants={item}
                onClick={(e) => { e.stopPropagation(); onShare(); }}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
                title="Share this stat"
              >
                <Share2 size={16} />
              </motion.button>
            )}
        </div>
        {subtitle && (
          <motion.p 
            className="text-sm text-white/50 mt-4 font-medium" 
            variants={item}
          >
            {subtitle}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  )
}

export const Reports: React.FC = () => {
  const { stats, tasks, goals } = useApp();
  
  // Calculate Derived Stats
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length || 1;
  const completionRate = Math.round((completedTasks / totalTasks) * 100);
  const activeGoals = goals.length;
  
  // XP Progress to next level logic (simplified)
  const nextLevelXP = stats.level * 500;
  const xpProgress = Math.round((stats.exp / nextLevelXP) * 100);

  const handleShare = async (title: string, text: string) => {
    const shareData = {
      title,
      text,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback
      navigator.clipboard.writeText(`${title}\n${text}\n${window.location.href}`);
      alert('Copied to clipboard!'); // Could be a toast in a fuller implementation
    }
  };

  return (
    <div className="w-full h-full p-4 md:p-8 overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics Report</h1>
        <p className="text-white/40">Real-time insights into your productivity system.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 min-h-[600px]">
        {/* Main Card: Total XP / Level */}
        <div className="md:col-span-2 min-h-[250px]">
          <BentoCard
            title="Total Experience"
            value={`${stats.exp} XP`}
            subtitle={`Level ${stats.level} • ${xpProgress}% to next level`}
            colors={["#4F46E5", "#818CF8", "#C7D2FE"]} // Indigo theme
            delay={0.1}
            onShare={() => handleShare('Fameo Life OS Progress', `I just reached Level ${stats.level} with ${stats.exp} XP in Fameo Life OS! Leveling up my productivity.`)}
          />
        </div>

        {/* Card: Focus Time */}
        <div className="min-h-[250px]">
             <BentoCard
                title="Focus Today"
                value={`${stats.focusMinutesToday}m`}
                subtitle="Deep work session time"
                colors={["#10B981", "#34D399", "#A7F3D0"]} // Emerald theme
                delay={0.2}
            />
        </div>

        {/* Card: Completion Rate */}
        <div className="min-h-[250px]">
             <BentoCard
                title="Completion Rate"
                value={`${completionRate}%`}
                subtitle={`${completedTasks} out of ${tasks.length} tasks done`}
                colors={["#F59E0B", "#FBBF24", "#FDE68A"]} // Amber theme
                delay={0.3}
                onShare={() => handleShare('Getting Things Done', `My task completion rate is ${completionRate}% today on Fameo Life OS! Keeping the momentum going.`)}
            />
        </div>

        {/* Card: Active Goals */}
        <div className="md:col-span-2 min-h-[250px]">
          <BentoCard
            title="Active Goals"
            value={activeGoals}
            subtitle={`${goals.filter(g => g.progress === 100).length} goals achieved fully`}
            colors={["#EC4899", "#F472B6", "#FBCFE8"]} // Pink theme
            delay={0.4}
          />
        </div>

        {/* Wide Card: Streak */}
        <div className="md:col-span-3 min-h-[250px]">
          <BentoCard
            title="Consistency Streak"
            value={`${stats.streak} Days`}
            subtitle="You're on fire! Keep showing up every day to build lasting habits."
            colors={["#8B5CF6", "#A78BFA", "#C4B5FD"]} // Violet theme
            delay={0.5}
            onShare={() => handleShare('Consistency is Key', `I'm on a ${stats.streak}-day productivity streak with Fameo Life OS! Watch me go. 🔥`)}
          />
        </div>
      </div>
    </div>
  )
}
