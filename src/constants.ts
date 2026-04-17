import { Question, Part2CueCard } from './types';

export const PART_1_TOPICS = [
  {
    name: 'Hometown',
    questions: [
      {
        text: 'Where is your hometown?',
        sampleAnswer: 'I was born and raised in Hanoi, the capital city of Vietnam. It is a [[vibrant metropolitan area]] known for its [[rich history]] and [[delicious street food]].',
        tips: 'Hãy tập trung phát âm rõ ràng từ "vibrant" và "metropolitan". Sử dụng ngữ điệu lên-xuống tự nhiên.'
      },
      {
        text: 'What do you like most about your hometown?',
        sampleAnswer: 'What I love most is the atmosphere, especially in the Old Quarter. There is a [[unique blend]] of [[ancient architecture]] and [[modern lifestyle]] that you can\'t find elsewhere.',
        tips: 'Nhấn mạnh từ "unique" để bộc lộ cảm xúc. Hãy ngắt nghỉ một chút sau từ "atmosphere" để tạo hiệu quả.'
      }
    ]
  },
  {
    name: 'Work or Study',
    questions: [
      {
        text: 'Do you work or are you a student?',
        sampleAnswer: 'Currently, I am a final-year student majoring in International Business. I find it quite challenging but extremely rewarding at the same time.',
        tips: 'Nhấn mạnh các tính từ "challenging" và "rewarding" để làm bật lên sự đối lập trong cảm xúc của bạn.'
      },
      {
        text: 'What do you like most about your job/studies?',
        sampleAnswer: 'I really enjoy the practical aspects of my course. We get to work on real-life case studies, which helps me understand how global markets actually function.',
        tips: 'Giữ tốc độ nói ổn định. Sử dụng từ "really enjoy" để thể hiện sự hứng thú thực sự thông qua giọng điệu.'
      }
    ]
  },
  {
    name: 'Hobbies',
    questions: [
      {
        text: 'What do you like to do in your free time?',
        sampleAnswer: 'In my spare time, I usually go for a run in the park or [[lose myself in a good book]]. It\'s a [[great way]] for me to [[unwind]] after a [[hectic day]].',
        tips: 'Hãy dùng giọng điệu thoải mái. Cụm từ "lose myself in a good book" nên thể hiện cảm xúc một cách tự nhiên.'
      },
      {
        text: 'How much time do you spend on your hobbies?',
        sampleAnswer: 'I try to dedicate at least an hour every evening to my hobbies. On weekends, I might spend even more time if I don\'t have any pressing commitments.',
        tips: 'Phát âm rõ ràng các từ "dedicate" và "commitments". Sử dụng cụm "even more" để tăng thêm phần nhấn mạnh.'
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
    sampleAnswer: 'Intro: Today I\'d like to talk about my high school teacher, Mr. Nam.\n\nContext: [[If my memory serves me right]], Mr. Nam was tall and slim, who was [[very supportive]] and friendly to students. I first met him when I was a [[struggling tenth grader]] who couldn\'t understand basic math.\n\nStory: At that time, I was [[almost failing]] the subject because I didn\'t get almost anything about maths. However, Mr. Nam [[spent extra hours]] explaining concepts using [[real-world examples]]. Eventually, I not only passed but [[became top of my class]]. Today, I\'m [[pursuing an engineering degree]] thanks to him.\n\nConclusion: Through this experience, I feel [[very grateful]] and I really hope I can visit him soon to show my gratitude.',
    tips: 'Part 2 yêu cầu một bài nói dài. Hãy sử dụng Framework để giữ cho câu chuyện của bạn có tổ chức. Sử dụng các từ nối như "Eventually", "However", và "Currently" để thể hiện trình tự thời gian.'
  }
];

export const PART_3_QUESTIONS: { [cueCardId: string]: { text: string, sampleAnswer: string, tips: string }[] } = {
  p2_1: [
    {
      text: 'What qualities make someone a good role model?',
      sampleAnswer: '[[In my view]], a good role model should possess [[integrity and resilience]]. They need to [[lead by example]] and show others how to [[handle failure with grace]]. For instance, an athlete who overcomes a career-threatening injury through [[sheer determination]] can [[inspire countless youngsters]] to never give up on their dreams.',
      tips: 'Sử dụng cụm "In my view" để đưa ra ý kiến của bạn. Nhấn mạnh các từ "integrity" và "resilience".'
    },
    {
      text: 'Do you think famous people have a responsibility to be good role models?',
      sampleAnswer: 'Absolutely. Since they are [[constantly in the public eye]], their actions can [[significantly influence]] the [[younger generation]], both positively and negatively. For example, celebrities who use their platform to [[raise awareness]] about climate change can [[mobilize millions of followers]] to adopt more [[eco-friendly habits]].',
      tips: 'Bắt đầu bằng một từ "Absolutely" mạnh mẽ để thể hiện sự tương tác. Sử dụng cấu trúc "both... and..." để câu trả lời thêm chặt chẽ.'
    },
    {
      text: 'How have role models changed compared to the past?',
      sampleAnswer: 'I think role models [[used to be limited to]] historical figures or family members. Nowadays, thanks to social media, anyone who shares [[inspiring content]] can become a role model. To illustrate, in the past, a child might have [[looked up to]] a local hero, but today, a teenager might [[find inspiration from]] a tech entrepreneur on YouTube.',
      tips: 'Hãy đối lập cụm "used to be" với "Nowadays" bằng cách thay đổi tông giọng và tốc độ nói.'
    }
  ]
};
