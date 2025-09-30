import type { Topic } from './types';
import { 
  FlaskIcon, 
  BookIcon, 
  ChipIcon, 
  PaletteIcon, 
  UsersIcon, 
  GlobeIcon, 
  HomeIcon, 
  RocketIcon,
  MusicNoteIcon
} from './components/icons/TopicIcons';

export const TOPICS: Topic[] = [
  {
    id: 'science_nature',
    name: 'science_nature',
    icon: FlaskIcon,
    prompt: 'prompt_science_nature',
    gradient: 'from-green-400 to-teal-500',
  },
  {
    id: 'tech_engineering',
    name: 'tech_engineering',
    icon: ChipIcon,
    prompt: 'prompt_tech_engineering',
    gradient: 'from-sky-500 to-indigo-500',
  },
  {
    id: 'music',
    name: 'music',
    icon: MusicNoteIcon,
    prompt: 'prompt_music',
    gradient: 'from-pink-500 to-purple-600',
  },
  {
    id: 'arts_culture',
    name: 'arts_culture',
    icon: PaletteIcon,
    prompt: 'prompt_arts_culture',
    gradient: 'from-rose-400 to-pink-600',
  },
  {
    id: 'society_dev',
    name: 'society_dev',
    icon: UsersIcon,
    prompt: 'prompt_society_dev',
    gradient: 'from-fuchsia-500 to-purple-600',
  },
  {
    id: 'global_practical',
    name: 'global_practical',
    icon: GlobeIcon,
    prompt: 'prompt_global_practical',
    gradient: 'from-blue-400 to-emerald-400',
  },
  {
    id: 'personal_life',
    name: 'personal_life',
    icon: HomeIcon,
    prompt: 'prompt_personal_life',
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  {
    id: 'frontier_fields',
    name: 'frontier_fields',
    icon: RocketIcon,
    prompt: 'prompt_frontier_fields',
    gradient: 'from-slate-600 to-gray-500',
  },
  {
    id: 'humanities',
    name: 'humanities',
    icon: BookIcon,
    prompt: 'prompt_humanities',
    gradient: 'from-amber-500 to-orange-600',
  },
];