import {z} from"zod"

// =============    AUTH      ============

export const registerSchema = z.object({
  name :    z.string().min(4,"Atleast 4 character hone chahiye"),
  email:    z.string().email("vaild email"),
  password: z.string().min(5,"Password 5 characters ka hona chahiye").max(8,"Password atMax 8 character ka hona chahiye")  
})

export const loginSchema = z.object({
  email:z.string().email("valid email honi chahiye"),
  password:z.string().min(1, "Password chahiye")
})


// ============    CONVERSATION     ===========

export const createConversationSchema = z.object({
  model: z.string().default("llama-3.3-70b-versatile")
})

export const updateConversationSchema= z.object({
  title: z.string().min(4).max(90).optional(),
  pinned: z.boolean().optional()
})
.refine(
  (data) => data.title !== undefined || data.pinned !== undefined,
  { message: "title ya pinned mein se koi ek chahiye" }
)


// ========= MESSAGE / CHAT  ============

export const messageSchema = z.object({
  role:    z.enum(["user", "assistant"]),
  content: z.string().min(1,"message khali nhi hona chahiye")
})


export const chatSchema = z.object({
  messages: z.array(messageSchema).min(1, "Kam se kam ek message chahiye"),
  conversationId: z.string().min(1, "ConversationId chahiye"),
  model: z.string().default("llama-3.3-70b-versatile"),
});