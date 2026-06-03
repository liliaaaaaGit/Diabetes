import type { ConversationTag } from "@/lib/types"

export type MockConversationLocalePack = {
  /** German seed title — stable lookup key in the DB */
  deTitle: string
  title: string
  summary: string
  tags: ConversationTag[]
  turns: Array<{ role: "user" | "assistant"; text: string }>
}

/** English display text for seeded mock chats (DB titles stay German). */
export const MOCK_CONVERSATIONS_EN: MockConversationLocalePack[] = [
  {
    deTitle: "Alltagsstress und hohe Werte",
    title: "Everyday stress and high readings",
    summary:
      "The last few days have been stressful — little sleep, a lot at work, and your readings stay above 200 no matter what you do. You feel like neither everyday life nor diabetes is really under control. Stepping outside briefly usually helps you, even if you rarely manage it; that could be a small resource right now.",
    tags: [
      { emoji: "🧠", label: "Stress" },
      { emoji: "📈", label: "High readings" },
    ],
    turns: [
      {
        role: "assistant",
        text: "Hey, good to see you. I noticed your readings have been over 200 more often the last few days — how are you feeling about that?",
      },
      {
        role: "user",
        text: "Really stressful. A lot going on at work, too little sleep, and no matter what I do my glucose stays high.",
      },
      {
        role: "assistant",
        text: "That sounds like a genuinely exhausting phase. Stress hormones can push blood glucose up a lot — that's not a weakness on your part, it's biology. What's draining you most right now?",
      },
      {
        role: "user",
        text: "This feeling that I don't have everyday life or diabetes under control.",
      },
      {
        role: "assistant",
        text: "That's a lot at once. In weeks like this you don't have to hit perfect numbers. Staying in the game is enough. Is there a small break or routine that helps you in between?",
      },
      {
        role: "user",
        text: "Stepping outside briefly actually helps. I just rarely do it.",
      },
      {
        role: "assistant",
        text: "That's a good anchor — a short walk helps your head and often your glucose too. Maybe plan it in once tomorrow. I'm here if you want to talk about how that goes.",
      },
    ],
  },
  {
    deTitle: "Frustrierende Nacht",
    title: "Frustrating night",
    summary:
      "Last night was really rough — first 55 at night, then 160 in the morning, and you don't understand why. You were afraid you'd done something wrong, but you're taking away that there can be several explanations. You're planning to bring it up with your diabetologist; you want to keep an eye on the pattern of a high morning reading after a nighttime hypo.",
    tags: [
      { emoji: "🌙", label: "Night hypo" },
      { emoji: "🩺", label: "Diabetes team" },
    ],
    turns: [
      {
        role: "assistant",
        text: "Hey, I see you had a hypo last night and were still high this morning. That's an exhausting mix — how is it sitting with you?",
      },
      {
        role: "user",
        text: "I just don't get it. First 55 in the middle of the night, then 160 in the morning. Did I do something wrong?",
      },
      {
        role: "assistant",
        text: "First: this doesn't sound like a mistake you made. For high fasting glucose after a nighttime hypo there are several possible explanations — for example dawn phenomenon, basal insulin wearing off overnight, or treating the hypo with quite a lot of carbs. What applies in your case is best sorted out with your diabetes team using your data.",
      },
      {
        role: "user",
        text: "Okay, that calms me down a bit. I thought I was ruining everything.",
      },
      {
        role: "assistant",
        text: "You're not. A night hypo is scary, and the fact you're thinking about it shows how much you're still showing up. Would you like to mention the reading at your next appointment? Then someone can look at the full picture.",
      },
      { role: "user", text: "Yes, I'll note it for my diabetologist." },
      {
        role: "assistant",
        text: "That's a good step. And today you can also breathe for a moment — the night was stressful enough. I'm here when you want to talk again.",
      },
    ],
  },
  {
    deTitle: "Hab keine Lust mehr",
    title: "I've had enough",
    summary:
      "You said openly that checking, injecting, and calculating feels like too much right now — real diabetes burnout. Sometimes you skip checking even though you know how hard that is. Walking your dog is something that still feels light; for your upcoming appointment you're thinking of bringing it up.",
    tags: [
      { emoji: "🔋", label: "Burnout" },
      { emoji: "💭", label: "Motivation" },
    ],
    turns: [
      {
        role: "assistant",
        text: "Hey. Your readings have been quite a rollercoaster the last two weeks. How are you actually doing — not the numbers, you?",
      },
      {
        role: "user",
        text: "Honestly? I just don't want to anymore. Check, inject, calculate. Every day. I'm done.",
      },
      {
        role: "assistant",
        text: "That's diabetes burnout, and it's as real as diabetes itself. This constant load, every single day — that's a lot. Feeling like this doesn't mean you're weak; it means you've carried a lot for a long time.",
      },
      {
        role: "user",
        text: "Sometimes I just skip checking. I know that's not good.",
      },
      {
        role: "assistant",
        text: "I don't need to judge that — I get where it comes from. Diabetes management isn't all-or-nothing. If checking six times is too much right now, three times is still a lot. Is there something in your day that still feels light?",
      },
      { role: "user", text: "Walking my dog. I don't think about anything then." },
      {
        role: "assistant",
        text: "That's gold — movement, fresh air, and distance from the noise in your head, all in one. Let's treat that as your anchor, not a duty. And if the heaviness stays: would your diabetologist be someone to talk to about it?",
      },
      { role: "user", text: "Maybe. I have an appointment soon anyway." },
      {
        role: "assistant",
        text: "That sounds like a good moment to bring it up. You did something important today — you said it's too much. I'm here, with no expectations.",
      },
    ],
  },
  {
    deTitle: "Alles Achterbahn",
    title: "Everything's a rollercoaster",
    summary:
      "Your day went from low to over 250 — constantly correcting, still no calm, and in the end you feel empty. It feels pointless even though you did a lot all day. Going to bed earlier might give you a little breathing room tomorrow — that's what you're aiming for.",
    tags: [
      { emoji: "🎢", label: "Swings" },
      { emoji: "😮‍💨", label: "Exhaustion" },
    ],
    turns: [
      {
        role: "assistant",
        text: "Hey, your day looked wild today — from low to over 250. That makes you tired, right?",
      },
      {
        role: "user",
        text: "Totally. I correct up and down all day and still can't settle.",
      },
      {
        role: "assistant",
        text: "This constant chasing is incredibly draining — not just physically, also in your head. You're doing a lot right now even when it doesn't feel like success.",
      },
      { role: "user", text: "It feels pointless." },
      {
        role: "assistant",
        text: "Feeling pointless doesn't mean it is — on a day with swings like this, stability is almost impossible no matter how well you manage. Looking at tomorrow: is there one small thing that would make the day easier?",
      },
      { role: "user", text: "Maybe just sleep earlier. I'm just wiped out." },
      {
        role: "assistant",
        text: "That sounds like real self-care, not giving up. Sleep helps glucose more than people think. Call it a day for today — the rest can wait.",
      },
    ],
  },
  {
    deTitle: "Erkältet und alles hoch",
    title: "Sick and everything high",
    summary:
      "You've had a cold for two days, feel wiped out, and glucose won't come down despite more insulin — that leaves you puzzled. You've thought about calling your diabetes team. Today you mainly want rest and to drink enough.",
    tags: [
      { emoji: "🤒", label: "Sick" },
      { emoji: "📈", label: "High readings" },
    ],
    turns: [
      {
        role: "assistant",
        text: "Hey, I see your readings have been noticeably higher for two days — and you mentioned you have a cold. How do you feel?",
      },
      {
        role: "user",
        text: "Wiped out. And glucose just won't come down even though I'm injecting more.",
      },
      {
        role: "assistant",
        text: "That's doubly exhausting right now — being sick and stubborn readings. With an infection the body often needs more insulin because stress hormones keep glucose up. How exactly to adjust is best cleared with your diabetes team — especially on sick days that's important.",
      },
      { role: "user", text: "Yeah, I've thought about calling them." },
      {
        role: "assistant",
        text: "That sounds very sensible. Many clinics have guidance for exactly these days. And besides that: resting isn't laziness right now, it's part of care. Are you drinking enough?",
      },
      { role: "user", text: "So-so, but I'll do that now." },
      {
        role: "assistant",
        text: "Good. Be gentle with yourself today — your body has enough to do. I'm here if you want to check in.",
      },
    ],
  },
  {
    deTitle: "Sorge vor dem nächsten HbA1c",
    title: "Worry about the next HbA1c",
    summary:
      "Your appointment is on your mind — you're afraid your HbA1c is worse than you hoped, and you still feel guilty. You want to note two or three situations that feel especially hard beforehand so you go into the conversation prepared.",
    tags: [
      { emoji: "🩺", label: "Clinic visit" },
      { emoji: "🧪", label: "HbA1c" },
    ],
    turns: [
      {
        role: "assistant",
        text: "Hey, you have an appointment soon — is that on your mind?",
      },
      {
        role: "user",
        text: "Yes, totally. I'm afraid my HbA1c is worse than I hoped.",
      },
      {
        role: "assistant",
        text: "That's very understandable. A number can quickly feel like a verdict even though it's only a snapshot. The visit can also be about what realistically works in everyday life.",
      },
      { role: "user", text: "I still feel guilty though." },
      {
        role: "assistant",
        text: "Guilt is common — but it rarely helps. You carry a lot of responsibility every day. Maybe note 2–3 situations that feel especially hard before the visit. Then the talk gets more concrete.",
      },
      { role: "user", text: "Good idea. Then I'm not going in with an empty head." },
      {
        role: "assistant",
        text: "Exactly. You go in prepared, not alone with it. If you want, we can sort afterward what feels doable for you.",
      },
    ],
  },
  {
    deTitle: "Kleine Routine, die hilft",
    title: "A small routine that helps",
    summary:
      "Your readings have been calmer this week and you notice less noise in your head day to day. Ten minutes walking after dinner and a quick check — that mini routine carries you. Your partner reminds you kindly when you forget; that feels like support, not control.",
    tags: [
      { emoji: "🧩", label: "Routine" },
      { emoji: "🤝", label: "Support" },
      { emoji: "✅", label: "Stability" },
    ],
    turns: [
      {
        role: "assistant",
        text: "Hey, your readings look noticeably calmer this week. Do you notice a difference in daily life too?",
      },
      {
        role: "user",
        text: "Yes, less noise in my head. I have a mini routine now: ten minutes walking after dinner, then a quick check.",
      },
      {
        role: "assistant",
        text: "That sounds really good — small, concrete, doable. Routines like that often last longer than big resolutions. What helps you keep it up?",
      },
      {
        role: "user",
        text: "My partner reminds me kindly when I forget.",
      },
      {
        role: "assistant",
        text: "That's strong support. Not control, relief. And you're doing it — that's your achievement.",
      },
      { role: "user", text: "Yeah, feels stable for the first time in a long while." },
      {
        role: "assistant",
        text: "I'm really glad. Keep the routine deliberately small so it stays doable in stressful weeks too.",
      },
    ],
  },
  {
    deTitle: "Sport hilft",
    title: "Exercise helps",
    summary:
      "You've noticed that regular movement — walking, cycling, jogging — does you good: after exercise you're more relaxed and your afternoon glucose stays calmer. Exercise seems like a resource right now that carries both readings and mood — loosely two or three times a week, without pressure.",
    tags: [
      { emoji: "🏃", label: "Exercise" },
      { emoji: "🙂", label: "Mood" },
    ],
    turns: [
      {
        role: "assistant",
        text: "Hey, I noticed you've been walking or cycling more lately — and your afternoon readings look calmer. How does that feel?",
      },
      {
        role: "user",
        text: "Really good. After jogging I'm more relaxed and glucose stays steadier.",
      },
      {
        role: "assistant",
        text: "That's a nice double effect — movement helps your head and your glucose. And the best part: you do it because it feels good, not because you have to.",
      },
      { role: "user", text: "Exactly. It doesn't feel like therapy." },
      {
        role: "assistant",
        text: "That's the point. When something doesn't feel like duty, you stick with it more. Want a loose small habit from it — no performance pressure?",
      },
      { role: "user", text: "Yeah, two or three times a week. Without stress." },
      {
        role: "assistant",
        text: "Sounds perfect. Enjoy the rounds — and tell me how it keeps going if you like.",
      },
    ],
  },
  {
    deTitle: "Endlich stabile Werte",
    title: "Finally stable readings",
    summary:
      "You're a bit proud: this week a lot was in range — a big step compared to what you thought in June. You took away that less pressure helps you more than more control.",
    tags: [
      { emoji: "✅", label: "Stable" },
      { emoji: "🌟", label: "Proud" },
    ],
    turns: [
      {
        role: "assistant",
        text: "Hey, your time in range was really high this week. After the last months that's a big deal — how are you with that?",
      },
      {
        role: "user",
        text: "Honestly a bit proud. In June I still thought I'd never manage it.",
      },
      {
        role: "assistant",
        text: "That sentence carries weight — from 'I'll never manage' to 'I'm proud'. That didn't just happen; you worked for it. What are you taking from the last weeks?",
      },
      { role: "user", text: "That less pressure helps me more than more control." },
      {
        role: "assistant",
        text: "That's a valuable insight — and it carries through harder days that will come back. Then it's not failure, it's part of the rollercoaster.",
      },
      { role: "user", text: "Yeah. I think I'm handling it more calmly." },
      {
        role: "assistant",
        text: "That sounds like a good place to be. I'm really happy for you — and I'll stay nearby.",
      },
    ],
  },
  {
    deTitle: "Angst vor Hypos in der Nacht",
    title: "Fear of night hypos",
    summary:
      "You hardly dare sleep properly — fear of sleeping through a hypo is big. You keep waking to check, and that steals your sleep. You're planning to bring up nighttime safety with your diabetes team; even that small plan calms you a bit.",
    tags: [
      { emoji: "🌙", label: "Hypo fear" },
      { emoji: "😴", label: "Sleep" },
    ],
    turns: [
      {
        role: "assistant",
        text: "Hey, you seem tense the last few days — and there were a few low readings at night. Is that on your mind?",
      },
      {
        role: "user",
        text: "Yes, I hardly dare sleep properly. What if I sleep through a hypo?",
      },
      {
        role: "assistant",
        text: "That fear is completely understandable — night hypos are scary and wanting to feel safe makes sense. How much is it stealing your sleep right now?",
      },
      {
        role: "user",
        text: "A lot. I keep waking up to check.",
      },
      {
        role: "assistant",
        text: "That wears you down over time. There are ways to make nights safer — but what fits you is best discussed with your diabetes team; they know your patterns. Would that be a topic for your next visit?",
      },
      {
        role: "user",
        text: "Yes, I'll bring it up. Even feeling something can be done already helps.",
      },
      {
        role: "assistant",
        text: "Exactly — you're not helpless with this. Tonight you can know you're looking after yourself well. I'm here if you want to talk.",
      },
    ],
  },
  {
    deTitle: "Ein richtig guter Tag",
    title: "A really good day",
    summary:
      "You had a day where readings stayed stable and diabetes didn't run everything — that feels good. You notice you often question good days instead of letting them stand. You want to keep this moment as a reminder that things can feel light too.",
    tags: [
      { emoji: "🌟", label: "Good day" },
      { emoji: "🙂", label: "Mood" },
    ],
    turns: [
      {
        role: "assistant",
        text: "Hey, your day looked really smooth today — stable readings, few swings. How was it for you?",
      },
      {
        role: "user",
        text: "Really nice. One of those days when diabetes doesn't run everything.",
      },
      {
        role: "assistant",
        text: "Days like that are precious. Good that you notice it instead of immediately asking what to fix next time.",
      },
      { role: "user", text: "True, I often do that." },
      {
        role: "assistant",
        text: "Then let's leave today as it is — good. Maybe keep it in mind for a harder day: proof it can feel light too.",
      },
      { role: "user", text: "I will. Feels good to hold onto that." },
      {
        role: "assistant",
        text: "Enjoy the evening. I'm happy with you — until next time.",
      },
    ],
  },
]
