import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Using mock mode.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==================== AUTH ====================
export const supabaseAuth = {
  signUp: async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  signIn: async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  getUser: async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  getSession: async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  onAuthStateChange: (callback) => {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
  }
};

// ==================== PRESENCE ====================
export const presenceService = {
  updatePresence: async (state, device = 'web') => {
    if (!supabase) return;
    const user = await supabaseAuth.getUser();
    if (!user) return;

    await supabase.from('presence').upsert({
      user_id: user.id,
      state,
      device,
      last_active: new Date().toISOString(),
    });
  },

  setOnline: (device = 'web') => presenceService.updatePresence('online', device),
  setOffline: () => presenceService.updatePresence('offline'),
  setIdle: () => presenceService.updatePresence('idle'),

  subscribeToPresence: (onChange) => {
    if (!supabase) return null;
    return supabase
      .channel('presence-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'presence',
      }, (payload) => {
        onChange(payload.new);
      })
      .subscribe();
  },

  getPresenceList: async () => {
    if (!supabase) return [];
    const { data } = await supabase.from('presence').select('*');
    return data || [];
  }
};

// ==================== CALLS ====================
export const callsService = {
  startCall: async (calleeId) => {
    if (!supabase) throw new Error('Supabase not configured');
    const user = await supabaseAuth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('calls')
      .insert({
        caller_id: user.id,
        callee_id: calleeId,
        status: 'ringing',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  answerCall: async (callId) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('calls')
      .update({ status: 'active' })
      .eq('id', callId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  endCall: async (callId, status = 'ended') => {
    if (!supabase) throw new Error('Supabase not configured');
    const endedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from('calls')
      .update({ status, ended_at: endedAt })
      .eq('id', callId)
      .select()
      .single();

    if (error) throw error;

    // Log to MongoDB via backend API
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${backendUrl}/api/call-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: data.id,
          callerId: data.caller_id,
          calleeId: data.callee_id,
          status,
          startedAt: data.started_at,
          endedAt,
        }),
      });
    } catch (err) {
      console.error('Failed to log call to MongoDB:', err);
    }

    return data;
  },

  subscribeToIncomingCalls: (userId, onCallUpdate) => {
    if (!supabase) return null;
    return supabase
      .channel(`calls:user:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'calls',
        filter: `callee_id=eq.${userId}`,
      }, (payload) => {
        onCallUpdate(payload.new);
      })
      .subscribe();
  },

  subscribeToOutgoingCalls: (userId, onCallUpdate) => {
    if (!supabase) return null;
    return supabase
      .channel(`calls:outgoing:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'calls',
        filter: `caller_id=eq.${userId}`,
      }, (payload) => {
        onCallUpdate(payload.new);
      })
      .subscribe();
  },

  getCallHistory: async (userId) => {
    if (!supabase) return [];
    const { data } = await supabase
      .from('calls')
      .select('*')
      .or(`caller_id.eq.${userId},callee_id.eq.${userId}`)
      .order('started_at', { ascending: false })
      .limit(50);
    return data || [];
  }
};

// ==================== CONVERSATIONS & MESSAGES ====================
export const messagingService = {
  createConversation: async (title, participantIds) => {
    if (!supabase) throw new Error('Supabase not configured');
    const user = await supabaseAuth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({ title, created_by: user.id })
      .select()
      .single();

    if (error) throw error;

    // Add participants including creator
    const participants = [user.id, ...participantIds].map(userId => ({
      conversation_id: conversation.id,
      user_id: userId,
      role: userId === user.id ? 'owner' : 'member'
    }));

    await supabase.from('conversation_participants').insert(participants);

    return conversation;
  },

  getConversations: async () => {
    if (!supabase) return [];
    const user = await supabaseAuth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        role,
        conversations (id, title, created_at)
      `)
      .eq('user_id', user.id);

    return data?.map(d => ({ ...d.conversations, role: d.role })) || [];
  },

  sendMessage: async (conversationId, content) => {
    if (!supabase) throw new Error('Supabase not configured');
    const user = await supabaseAuth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages_live')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getMessages: async (conversationId, limit = 100) => {
    if (!supabase) return [];
    const { data } = await supabase
      .from('messages_live')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    return data || [];
  },

  subscribeToConversation: (conversationId, onMessage) => {
    if (!supabase) return null;
    return supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages_live',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        onMessage(payload.new);
      })
      .subscribe();
  }
};

// ==================== MEETINGS ====================
export const meetingsService = {
  createMeeting: async (title, description, startTime, endTime, participantIds = []) => {
    if (!supabase) throw new Error('Supabase not configured');
    const user = await supabaseAuth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
        host_id: user.id,
        title,
        description,
        start_time: startTime,
        end_time: endTime,
      })
      .select()
      .single();

    if (error) throw error;

    // Add participants including host
    const participants = [user.id, ...participantIds].map(userId => ({
      meeting_id: meeting.id,
      user_id: userId,
      role: userId === user.id ? 'host' : 'attendee'
    }));

    await supabase.from('meeting_participants').insert(participants);

    return meeting;
  },

  getMeetings: async () => {
    if (!supabase) return [];
    const user = await supabaseAuth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('meeting_participants')
      .select(`
        meeting_id,
        role,
        meetings (id, title, description, start_time, end_time, host_id, created_at)
      `)
      .eq('user_id', user.id);

    return data?.map(d => ({ ...d.meetings, role: d.role })) || [];
  },

  updateMeeting: async (meetingId, updates) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('id', meetingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ==================== PROFILES ====================
export const profilesService = {
  getProfile: async (userId) => {
    if (!supabase) return null;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  },

  updateProfile: async (updates) => {
    if (!supabase) throw new Error('Supabase not configured');
    const user = await supabaseAuth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ==================== STORAGE ====================
export const storageService = {
  uploadFile: async (bucket, path, file) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;
    return data;
  },

  getPublicUrl: (bucket, path) => {
    if (!supabase) return null;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  uploadAvatar: async (file) => {
    const user = await supabaseAuth.getUser();
    if (!user) throw new Error('Not authenticated');

    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    
    await storageService.uploadFile('emerald-assets', path, file);
    return storageService.getPublicUrl('emerald-assets', path);
  }
};

export default supabase;
