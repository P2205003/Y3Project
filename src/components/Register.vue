<template>
  <div>
    <SiteNav />
    <TopBar />
    <Ribbon />
    <SideMenu />
    <div class="register-page">
      <el-card class="register-card" shadow="hover">
        <h2 class="title">Register</h2>
        <el-form :model="registerForm"
                 :rules="rules"
                 ref="registerFormRef"
                 label-width="120px"
                 @submit.prevent="handleSubmit">
          <el-form-item label="Full Name" prop="fullName">
            <el-input v-model="registerForm.fullName" placeholder="Enter your full name" />
          </el-form-item>
          <el-form-item label="Username" prop="username">
            <el-input v-model="registerForm.username" placeholder="Create a username" />
          </el-form-item>
          <el-form-item label="Email" prop="email">
            <el-input v-model="registerForm.email" placeholder="Enter your email" />
          </el-form-item>
          <el-form-item label="Password" prop="password">
            <el-input v-model="registerForm.password"
                      placeholder="Create a password"
                      show-password />
          </el-form-item>
          <el-form-item label="Confirm Password" prop="confirmPassword">
            <el-input v-model="registerForm.confirmPassword"
                      placeholder="Confirm your password"
                      show-password />
          </el-form-item>
          <el-form-item label="Shipping Address" prop="shippingAddress">
            <el-input v-model="registerForm.shippingAddress"
                      placeholder="Enter your shipping address" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="isSubmitting" block @click="handleSubmit">
              {{ isSubmitting ? 'Registering...' : 'Register' }}
            </el-button>
            <router-link to="/login">
              <el-button type="text" block>Already have an account? Login</el-button>
            </router-link>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
  import SiteNav from '@/components/SiteNav.vue';
  import TopBar from '@/components/TopBar.vue';
  import Ribbon from '@/components/Ribbon.vue';
  import SideMenu from '@/components/SideMenu.vue';
  import { ElMessage } from 'element-plus';

  export default {
    name: 'Register',
    components: {
      SiteNav,
      TopBar,
      Ribbon,
      SideMenu,
    },
    data() {
      return {
        isSubmitting: false,
        registerForm: {
          fullName: '',
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          shippingAddress: '',
        },
        rules: {
          fullName: [{ required: true, message: 'Please enter your full name', trigger: 'blur' }],
          username: [{ required: true, message: 'Please enter a username', trigger: 'blur' }],
          email: [
            { required: true, message: 'Please enter your email', trigger: 'blur' },
            { type: 'email', message: 'Please enter a valid email address', trigger: ['blur', 'change'] },
          ],
          password: [
            { required: true, message: 'Please create a password', trigger: 'blur' },
            { min: 8, message: 'Password must be at least 8 characters', trigger: 'blur' }
          ],
          confirmPassword: [
            { required: true, message: 'Please confirm your password', trigger: 'blur' },
            {
              validator: (rule, value, callback) => {
                if (value !== this.registerForm.password) {
                  callback(new Error('Passwords do not match'));
                } else {
                  callback();
                }
              },
              trigger: 'blur',
            },
          ],
          shippingAddress: [{ required: true, message: 'Please enter your shipping address', trigger: 'blur' }],
        },
      };
    },
    methods: {
      async handleSubmit() {
        this.$refs.registerFormRef.validate(async (valid) => {
          if (valid) {
            this.isSubmitting = true; // Start loading state
            try {
              const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.registerForm),
              });

              if (response.ok) {
                ElMessage.success('Registration successful! Redirecting to login...');
                setTimeout(() => {
                  this.$router.push('/login'); // Redirect to login page
                }, 1500); // Delay for 1.5 seconds
              } else {
                const errorData = await response.json();
                ElMessage.error(errorData.message || 'Registration failed');
              }
            } catch (error) {
              console.error('Registration error:', error);
              ElMessage.error('An unexpected error occurred. Please try again.');
            } finally {
              this.isSubmitting = false; // End loading state
            }
          } else {
            console.log('Validation failed');
            return false;
          }
        });
      },
    },
  };
</script>

<style scoped>
  .register-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 200px); /* Changed from height to min-height */
    overflow-y: auto; /* Add scroll if content overflows */
    padding: 20px;
    background-color: #f5f5f5;
  }

  .register-card {
    width: 80%; /* Adjust the width for a more compact form */
    height: 90%;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    background-color: #ffffff;
    display: flex; /* Flexbox to center content */
    flex-direction: column; /* Stack form elements vertically */
    justify-content: center; /* Center content vertically */
    align-items: center; /* Center content horizontally */
  }

  .title {
    text-align: center;
    font-size: 28px; /* Larger font size */
    font-weight: bold;
    margin-bottom: 30px;
    color: #333;
  }

  .el-form-item {
    margin-bottom: 20px; /* Spacing between form items */
  }

  .el-input,
  .el-textarea {
    width: 100%; /* Full width inputs */
  }

  .el-form-item__error {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 300px;
  }

  .el-button {
    margin-top: 15px;
  }

  .el-button--primary {
    background-color: #409eff; /* Element Plus primary color */
    border-color: #409eff;
    width: 100%; /* Full width button */
    font-size: 16px; /* Larger font size */
  }

  .el-button--text {
    width: 100%;
    color: #606266; /* Muted text color */
    font-size: 14px;
  }

    .el-button--text:hover {
      color: #409eff;
    }
</style>
