import { Question, Part2CueCard } from './types';

export const PART_1_TOPICS = [
  {
    name: 'Hometown',
    questions: [
      {
        text: 'Where is your hometown?',
        sampleAnswer: 'I was born and raised in Hanoi, the capital city of Vietnam. It is a vibrant metropolitan area known for its rich history and delicious street food.',
        tips: 'Focus on clear pronunciation of "vibrant" and "metropolitan". Use a natural rising-falling intonation.'
      },
      {
        text: 'What do you like most about your hometown?',
        sampleAnswer: 'What I love most is the atmosphere, especially in the Old Quarter. There is a unique blend of ancient architecture and modern lifestyle that you can\'t find elsewhere.',
        tips: 'Emphasize the word "unique" to show emotion. Pause slightly after "atmosphere" for effect.'
      }
    ]
  },
  {
    name: 'Work or Study',
    questions: [
      {
        text: 'Do you work or are you a student?',
        sampleAnswer: 'Currently, I am a final-year student majoring in International Business. I find it quite challenging but extremely rewarding at the same time.',
        tips: 'Stress the adjectives "challenging" and "rewarding" to show contrast in your feelings.'
      },
      {
        text: 'What do you like most about your job/studies?',
        sampleAnswer: 'I really enjoy the practical aspects of my course. We get to work on real-life case studies, which helps me understand how global markets actually function.',
        tips: 'Keep a steady pace. Use "really enjoy" to express genuine interest through tone.'
      }
    ]
  },
  {
    name: 'Hobbies',
    questions: [
      {
        text: 'What do you like to do in your free time?',
        sampleAnswer: 'In my spare time, I usually go for a run in the park or lose myself in a good book. It\'s a great way for me to unwind after a hectic day.',
        tips: 'Use a relaxed tone. The phrase "lose myself in a good book" should sound expressive.'
      },
      {
        text: 'How much time do you spend on your hobbies?',
        sampleAnswer: 'I try to dedicate at least an hour every evening to my hobbies. On weekends, I might spend even more time if I don\'t have any pressing commitments.',
        tips: 'Pronounce "dedicate" and "commitments" clearly. Use "even more" to add emphasis.'
      }
    ]
  }
];

export const PART_2_CUE_CARDS: Part2CueCard[] = [
  {
    id: 'p2_1',
    part: 2,
    topic: 'Describe a person',
    text: 'Describe a person you admire.',
    prompts: [
      'Who this person is',
      'How you know this person',
      'What they are like',
      'And explain why you admire them.'
    ],
    framework: '1. Intro: Name the person.\n2. Context: How/When you met + personality description.\n3. Story: A time they helped you or achieved something (Past -> Climax -> Result -> Present).\n4. Conclusion: Hopes for them in the future.',
    sampleAnswer: 'Intro: Today I\'d like to talk about my high school teacher, Mr. Nam.\n\nContext: If my memory serves me right, Mr. Nam was tall and slim, who was very supportive and friendly to students. I first met him when I was a struggling tenth grader who couldn\'t understand basic math.\n\nStory: At that time, I was almost failing the subject because I didn\'t get almost anything about maths. However, Mr. Nam spent extra hours explaining concepts using real-world examples. Eventually, I not only passed but became top of my class. Today, I\'m pursuing an engineering degree thanks to him.\n\nConclusion: Through this experience, I feel very grateful and I really hope I can visit him soon to show my gratitude.',
    tips: 'Part 2 requires a long turn. Use the framework to keep your story organized. Use linking words like "Eventually", "However", and "Currently" to show the timeline.'
  }
];

export const PART_3_QUESTIONS: { [cueCardId: string]: { text: string, sampleAnswer: string, tips: string }[] } = {
  p2_1: [
    {
      text: 'What qualities make someone a good role model?',
      sampleAnswer: 'In my view, a good role model should possess integrity and resilience. They need to lead by example and show others how to handle failure with grace. For instance, an athlete who overcomes a career-threatening injury through sheer determination can inspire countless youngsters to never give up on their dreams.',
      tips: 'Use "In my view" to introduce your opinion. Stress "integrity" and "resilience".'
    },
    {
      text: 'Do you think famous people have a responsibility to be good role models?',
      sampleAnswer: 'Absolutely. Since they are constantly in the public eye, their actions can significantly influence the younger generation, both positively and negatively. For example, celebrities who use their platform to raise awareness about climate change can mobilize millions of followers to adopt more eco-friendly habits.',
      tips: 'Start with a strong "Absolutely" to show engagement. Use "both... and..." for a structured answer.'
    },
    {
      text: 'How have role models changed compared to the past?',
      sampleAnswer: 'I think role models used to be limited to historical figures or family members. Nowadays, thanks to social media, anyone who shares inspiring content can become a role model. To illustrate, in the past, a child might have looked up to a local hero, but today, a teenager might find inspiration from a tech entrepreneur on YouTube.',
      tips: 'Contrast "used to be" with "Nowadays" using tone and speed.'
    }
  ]
};
