import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role: 'tenant' | 'landlord';
}

export const signUp = async (data: SignUpData) => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      data.email, 
      data.password
    );
    
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, {
      displayName: data.fullName
    });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      userId: user.uid,
      email: data.email,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      role: data.role,
      verified: false,
      kycDocuments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return { success: true, user };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create account' 
    };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Fetch user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    return { 
      success: true, 
      user: userCredential.user,
      userData: userDoc.data()
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to sign in' 
    };
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to sign out' 
    };
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send reset email' 
    };
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};