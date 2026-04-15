import { Question, Part2CueCard } from './types';

export const PART_1_TOPICS = [
  {
    name: 'Hometown',
    questions: [
      'Where is your hometown?',
      'What do you like most about your hometown?',
      'Is it a good place for young people to live?'
    ]
  },
  {
    name: 'Work or Study',
    questions: [
      'Do you work or are you a student?',
      'What do you like most about your job/studies?',
      'What was your favorite subject when you were at school?'
    ]
  },
  {
    name: 'Hobbies',
    questions: [
      'What do you like to do in your free time?',
      'How much time do you spend on your hobbies?',
      'Is there a new hobby you would like to try in the future?'
    ]
  },
  {
    name: 'Pets',
    questions: [
      'Do you have any pets?',
      'What is your favorite animal?',
      'Why do people keep pets?'
    ]
  },
  {
    name: 'Weather',
    questions: [
      'What kind of weather do you like most?',
      'Does the weather affect your mood?',
      'What is the weather like in your country?'
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
    ]
  },
  {
    id: 'p2_2',
    part: 2,
    topic: 'Describe a place',
    text: 'Describe a beautiful place you have visited.',
    prompts: [
      'Where it is',
      'When you went there',
      'What you did there',
      'And explain why you think it is beautiful.'
    ]
  },
  {
    id: 'p2_3',
    part: 2,
    topic: 'Describe an event',
    text: 'Describe a memorable event in your life.',
    prompts: [
      'What the event was',
      'When and where it happened',
      'Who was with you',
      'And explain why it was memorable.'
    ]
  },
  {
    id: 'p2_4',
    part: 2,
    topic: 'Describe an object',
    text: 'Describe an important piece of technology you use.',
    prompts: [
      'What it is',
      'How long you have had it',
      'What you use it for',
      'And explain why it is important to you.'
    ]
  }
];

export const PART_3_QUESTIONS: { [cueCardId: string]: string[] } = {
  p2_1: [
    'What qualities make someone a good role model?',
    'Do you think famous people have a responsibility to be good role models?',
    'How have role models changed compared to the past?'
  ],
  p2_2: [
    'Why do people like to travel to beautiful places?',
    'How does tourism affect local environments?',
    'Do you think it is important to preserve natural beauty?'
  ],
  p2_3: [
    'Why are some events more memorable than others?',
    'How do celebrations differ between cultures?',
    'Do you think people spend too much money on big events like weddings?'
  ],
  p2_4: [
    'How has technology changed the way we communicate?',
    'What are the disadvantages of relying too much on technology?',
    'Do you think technology will replace teachers in the future?'
  ]
};
