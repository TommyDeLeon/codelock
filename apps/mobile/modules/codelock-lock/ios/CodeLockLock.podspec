Pod::Spec.new do |s|
  s.name           = 'CodeLockLock'
  s.version        = '0.1.0'
  s.summary        = 'CodeLock device lock, such as iOS permits.'
  s.author         = ''
  s.homepage       = 'https://github.com/'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
