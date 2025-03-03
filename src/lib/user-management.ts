// lib/user-management.ts
import { supabase } from './supabase';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  provider?: string;
}

export async function createOrUpdateUserProfile(userData: UserProfile): Promise<boolean> {
  try {
    // First, check if user already exists in our users table
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userData.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" which is fine
      console.error('Error checking for existing user:', fetchError);
      return false;
    }

    if (existingUser) {
      // Update existing user
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email: userData.email,
          name: userData.name,
          avatar_url: userData.avatar_url,
          provider: userData.provider,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        return false;
      }
    } else {
      // Create new user
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar_url: userData.avatar_url,
          provider: userData.provider,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating user profile:', insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in createOrUpdateUserProfile:', error);
    return false;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Unexpected error in getUserProfile:', error);
    return null;
  }
}