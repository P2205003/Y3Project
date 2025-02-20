<template>
  <div>
    <SiteNav />
    <TopBar />
    <Ribbon />
    <SideMenu />
    <div class="login-page">
      <el-card class="login-card" shadow="hover">
        <h2 class="title">Login</h2>
        <el-form :model="loginForm"
                 :rules="rules"
                 ref="loginFormRef"
                 label-width="0"
                 @submit.prevent="handleLogin">
          <!-- Username Field -->
          <el-form-item label="Username" prop="username" class="form-item">
            <el-input v-model="loginForm.username"
                      placeholder="Enter your username"
                      size="large"
                      class="form-input" />
          </el-form-item>
          <!-- Password Field -->
          <el-form-item label="Password" prop="password" class="form-item">
            <el-input v-model="loginForm.password"
                      placeholder="Enter your password"
                      show-password
                      size="large"
                      class="form-input" />
          </el-form-item>
          <!-- Login Button -->
          <el-form-item>
            <el-button type="primary"
                       size="large"
                       round
                       :loading="isSubmitting"
                       @click="handleLogin"
                       class="login-button">
              {{ isSubmitting ? 'Logging in...' : 'Login' }}
            </el-button>
          </el-form-item>
          <!-- Register Link -->
          <router-link to="/register" class="register-link">
            <el-button type="text" block size="large">
              Don't have an account? Register now
            </el-button>
          </router-link>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
  import SiteNav from "@/components/SiteNav.vue";
  import TopBar from "@/components/TopBar.vue";
  import Ribbon from "@/components/Ribbon.vue";
  import SideMenu from "@/components/SideMenu.vue";
  import { ElMessage } from 'element-plus';

  export default {
    name: "Login",
    components: {
      SiteNav,
      TopBar,
      Ribbon,
      SideMenu,
    },
    data() {
      return {
        isSubmitting: false,
        loginForm: {
          username: "",
          password: "",
        },
        rules: {
          username: [{ required: true, message: "Please enter your username", trigger: "blur" }],
          password: [{ required: true, message: "Please enter your password", trigger: "blur" }],
        },
      };
    },
    methods: {
      async handleLogin() {
        this.$refs.loginFormRef.validate(async (valid) => {
          if (valid) {
            this.isSubmitting = true;
            try {
              const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.loginForm),
              });

              if (response.ok) {
                const data = await response.json(); // Get user data from the response
                ElMessage.success('Login successful!');
                // Update the global login state in App.vue
                this.appContext.isLoggedIn = true;
                this.appContext.user = data.user; // Store the user object

                this.$router.push('/'); // Redirect to home page
              } else {
                const errorData = await response.json();
                ElMessage.error(errorData.message || 'Login failed');
              }
            } catch (error) {
              console.error('Login error:', error);
              ElMessage.error('An unexpected error occurred. Please try again.');
            } finally {
              this.isSubmitting = false;
            }
          } else {
            console.log("Validation failed")
            return false
          }
        });
      },
    },
    inject: ['appContext'], // Inject the appContext from App.vue
  };
</script>

<style scoped>
  /* (The styles from the original login.vue are good - keep them) */
  .login-page {
    display: flex;
    justify-content: center;
    align-items: center;
    height: calc(100vh - 200px); /* Adjust height for top components */
    background-color: #f5f5f5;
    padding: 20px;
  }

  .login-card {
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
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 30px;
    color: #333;
  }

  .form-item {
    width: 100%; /* Ensure form items take full width of the card */
    margin-bottom: 20px;
  }

  .form-input input {
    font-size: 20px;
    height: 50px;
    border-radius: 10px;
    width: 100%; /* Make input fields take full width */
  }

  .login-button {
    font-size: 18px;
    height: 50px;
    border-radius: 8px;
    background-color: #007bff;
    color: white;
    width: 100%; /* Make the button take full width */
  }

  .register-link {
    text-align: center;
    display: block;
    margin-top: 10px;
  }

    .register-link .el-button {
      font-size: 16px;
    }
</style>
