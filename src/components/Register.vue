<template>
    <div>
      <SiteNav />
      <TopBar />
      <Ribbon />
      <SideMenu />
      <div class="register-page">
        <el-card class="register-card" shadow="hover">
          <h2 class="title">Register</h2>
          <el-form :model="registerForm" :rules="rules" ref="registerForm" label-width="120px">
            <el-form-item label="Username" prop="username">
              <el-input v-model="registerForm.username" placeholder="Create a username" />
            </el-form-item>
            <el-form-item label="Password" prop="password">
              <el-input v-model="registerForm.password" placeholder="Create a password" show-password />
            </el-form-item>
            <el-form-item label="Confirm Password" prop="confirmPassword">
              <el-input v-model="registerForm.confirmPassword" placeholder="Confirm your password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" block @click="handleRegister">Register</el-button>
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
        registerForm: {
          username: '',
          password: '',
          confirmPassword: '',
        },
        rules: {
          username: [{ required: true, message: 'Please enter a username', trigger: 'blur' }],
          password: [{ required: true, message: 'Please create a password', trigger: 'blur' }],
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
        },
      };
    },
    methods: {
      handleRegister() {
        this.$refs.registerForm.validate((valid) => {
          if (valid) {
            alert(`Registered as ${this.registerForm.username} (demo only)`);
            // Add your registration logic here
          } else {
            console.log('Validation failed');
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
    height: calc(100vh - 200px); /* Adjust height for top components */
    background-color: #f5f5f5;
    padding: 20px;
  }
  .register-card {
    width: 400px;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    background-color: #fff;
  }
  .title {
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
    color: #333;
  }
  .el-button {
    margin-top: 10px;
  }
  </style>