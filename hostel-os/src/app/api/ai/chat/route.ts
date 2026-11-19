import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import {
  Student,
  Room,
  Invoice,
  Complaint,
  MessMenu,
  KnowledgeDocument,
  Allocation,
  AIConversation,
} from "@/models";
import { requireAuth } from "@/lib/security/rbac";
import { formatCurrency } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message string is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = auth.user;
    const lowerMsg = message.toLowerCase();

    // ─── TOOL EXECUTION & DATA RETRIEVAL (Role-Scoped) ──────────────────────────

    let toolData: Record<string, unknown> = {};

    // 1. Room Details Tool
    if (lowerMsg.includes("room") || lowerMsg.includes("allocation")) {
      if (user.role === "student") {
        const student = await Student.findOne({ userId: user.id })
          .populate("hostelId roomId")
          .lean();
        if (student?.roomId) {
          toolData.roomDetails = {
            roomNumber: (student.roomId as unknown as { roomNumber: string }).roomNumber,
            hostelName: (student.hostelId as unknown as { name: string })?.name,
            type: (student.roomId as unknown as { type: string }).type,
          };
        } else {
          toolData.roomDetails = "No active room allocated yet.";
        }
      }
    }

    // 2. Fee / Dues Tool
    if (lowerMsg.includes("fee") || lowerMsg.includes("due") || lowerMsg.includes("balance") || lowerMsg.includes("pay")) {
      if (user.role === "student" && user.studentId) {
        const invoices = await Invoice.find({ studentId: user.studentId }).lean();
        const totalDuePaise = invoices.reduce((acc, inv) => acc + inv.balancePaise, 0);
        toolData.feeStatus = {
          totalDueFormatted: formatCurrency(totalDuePaise),
          unpaidInvoicesCount: invoices.filter((i) => i.status !== "paid").length,
        };
      }
    }

    // 3. Mess Menu Tool
    if (lowerMsg.includes("mess") || lowerMsg.includes("food") || lowerMsg.includes("dinner") || lowerMsg.includes("lunch") || lowerMsg.includes("menu")) {
      const todayMenu = await MessMenu.findOne({
        date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }).lean();

      if (todayMenu) {
        toolData.todayMessMenu = {
          breakfast: todayMenu.meals.breakfast.items.join(", "),
          lunch: todayMenu.meals.lunch.items.join(", "),
          snacks: todayMenu.meals.snacks.items.join(", "),
          dinner: todayMenu.meals.dinner.items.join(", "),
        };
      } else {
        toolData.todayMessMenu = "Today's standard menu: Breakfast (Poha/Eggs), Lunch (Dal, Rice, Roti, Paneer), Snacks (Tea/Biscuits), Dinner (Special Veg/Chicken Biryani).";
      }
    }

    // 4. Complaints Tool
    if (lowerMsg.includes("complaint") || lowerMsg.includes("maintenance") || lowerMsg.includes("ticket") || lowerMsg.includes("repair")) {
      if (user.role === "student") {
        const complaints = await Complaint.find({ userId: user.id })
          .sort({ createdAt: -1 })
          .limit(3)
          .lean();
        toolData.recentComplaints = complaints.map((c) => ({
          ticketId: c.ticketId,
          title: c.title,
          status: c.status,
          priority: c.priority,
        }));
      } else if (["warden", "admin"].includes(user.role)) {
        const pendingCount = await Complaint.countDocuments({
          status: { $in: ["open", "assigned", "in_progress"] },
        });
        toolData.pendingComplaintsCount = pendingCount;
      }
    }

    // 5. RAG: Knowledge Document search (Hostel Rules & Policies)
    const knowledgeDocs = await KnowledgeDocument.find({ isActive: true }).limit(5).lean();
    const policyContext = knowledgeDocs
      .map((k) => `[${k.category.toUpperCase()}] ${k.title}: ${k.content}`)
      .join("\n");

    // ─── GENERATE RESPONSE (OpenAI or Local Synthesizer) ─────────────────────

    let reply = "";

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-")) {
      try {
        const systemPrompt = `You are the official HostelOS AI Assistant for HostelOS University.
User Name: ${user.name}
User Role: ${user.role}
User ID: ${user.id}

Strict Rules:
1. Always maintain role privacy. Never disclose another student's data.
2. Only reference facts provided in the Database Context and Policy Context below.
3. Be professional, empathetic, and concise.

Database Context:
${JSON.stringify(toolData, null, 2)}

Institutional Policies (RAG Context):
${policyContext || "Curfew: 10:00 PM. Visitors allowed: 9:00 AM - 7:00 PM. Quiet hours: 11:00 PM - 6:00 AM."}
`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message },
            ],
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          const aiJson = await response.json();
          reply = aiJson.choices[0].message.content;
        }
      } catch {
        // Fallback to local response synthesizer
      }
    }

    // High quality deterministic synthesizer if OpenAI not configured or failed
    if (!reply) {
      if (toolData.roomDetails) {
        if (typeof toolData.roomDetails === "string") {
          reply = `Hello ${user.name}! According to the database, you currently do not have an active room allocation assigned yet. Please contact the hostel administration.`;
        } else {
          const r = toolData.roomDetails as { roomNumber: string; hostelName?: string; type: string };
          reply = `Hello ${user.name}! You are currently allocated to **Room ${r.roomNumber}** (${r.type} occupancy) at **${r.hostelName || "Main Campus Hostel"}**.`;
        }
      } else if (toolData.feeStatus) {
        const f = toolData.feeStatus as { totalDueFormatted: string; unpaidInvoicesCount: number };
        reply = `Hello ${user.name}! Your current outstanding fee balance is **${f.totalDueFormatted}** across ${f.unpaidInvoicesCount} invoice(s). You can pay or view receipts in the Finance section.`;
      } else if (toolData.todayMessMenu) {
        const m = toolData.todayMessMenu as { breakfast: string; lunch: string; snacks: string; dinner: string };
        reply = `Here is today's mess menu:\n- 🍳 **Breakfast:** ${m.breakfast}\n- 🍲 **Lunch:** ${m.lunch}\n- ☕ **Snacks:** ${m.snacks}\n- 🍛 **Dinner:** ${m.dinner}`;
      } else if (toolData.recentComplaints) {
        const cList = toolData.recentComplaints as Array<{ ticketId: string; title: string; status: string }>;
        if (cList.length === 0) {
          reply = `You have no active maintenance complaints registered at this moment!`;
        } else {
          const formatted = cList.map((c) => `• [${c.ticketId}] "${c.title}" – Status: **${c.status.toUpperCase()}**`).join("\n");
          reply = `Here is the status of your recent complaints:\n${formatted}`;
        }
      } else if (lowerMsg.includes("rule") || lowerMsg.includes("curfew") || lowerMsg.includes("timing")) {
        reply = `Here are the key hostel policies:\n1. **Night Curfew:** All students must check in before 10:00 PM.\n2. **Visitor Timings:** 9:00 AM to 7:00 PM at common visitor lounges.\n3. **Silence Hours:** 11:00 PM to 6:00 AM.\n4. **Leave Policy:** Outpass applications must be submitted at least 6 hours in advance for Warden review.`;
      } else {
        reply = `Hello ${user.name}! I am your HostelOS AI Assistant. I can assist you with your room details, pending fee status, today's dining menu, tracking maintenance tickets, and explaining campus hostel guidelines. What would you like to know?`;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reply,
        retrievedTools: Object.keys(toolData),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "AI Assistant error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

