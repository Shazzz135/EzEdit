import { type AdjustmentValues } from '@/types/document'
import { VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE } from './adjustmentShaders'

export class WebGLAdjustmentPipeline {
  private gl: WebGL2RenderingContext
  private program: WebGLProgram | null = null
  private texture: WebGLTexture | null = null
  private vao: WebGLVertexArrayObject | null = null
  private vbo: WebGLBuffer | null = null
  private uniforms: Record<string, WebGLUniformLocation | null> = {}

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.initProgram()
    this.initBuffers()
  }

  private initProgram() {
    const gl = this.gl
    const vertShader = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
    const fragShader = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)

    const program = gl.createProgram()
    if (!program) throw new Error('Failed to create WebGL program')

    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program)
      gl.deleteProgram(program)
      throw new Error(`WebGL program linking failed: ${info}`)
    }

    this.program = program

    const uniformNames = [
      'u_image', 'u_resolution', 'u_exposure', 'u_brilliance',
      'u_highlights', 'u_shadows', 'u_contrast', 'u_brightness',
      'u_saturation', 'u_vibrance', 'u_warmth', 'u_tint',
      'u_sharpness', 'u_definition', 'u_noise'
    ]

    for (const name of uniformNames) {
      this.uniforms[name] = gl.getUniformLocation(program, name)
    }
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl
    const shader = gl.createShader(type)
    if (!shader) throw new Error('Failed to create WebGL shader')
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader)
      gl.deleteShader(shader)
      throw new Error(`Shader compilation failed: ${info}`)
    }
    return shader
  }

  private initBuffers() {
    const gl = this.gl
    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)

    // Full screen quad with UVs: [pos.x, pos.y, uv.x, uv.y]
    // WebGL textures have origin at lower-left, canvas images at top-left.
    const quadVertices = new Float32Array([
      -1, -1, 0, 1,
       1, -1, 1, 1,
      -1,  1, 0, 0,
      -1,  1, 0, 0,
       1, -1, 1, 1,
       1,  1, 1, 0,
    ])

    this.vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW)

    const aPos = gl.getAttribLocation(this.program!, 'a_position')
    const aTex = gl.getAttribLocation(this.program!, 'a_texCoord')

    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0)

    gl.enableVertexAttribArray(aTex)
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 16, 8)

    gl.bindVertexArray(null)
  }

  public setTexture(image: HTMLImageElement | ImageBitmap) {
    const gl = this.gl
    if (!this.texture) {
      this.texture = gl.createTexture()
    }

    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)

    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA8,
      image.width, image.height, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, image
    )

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  }

  public render(adjustments: AdjustmentValues, width: number, height: number) {
    const gl = this.gl
    if (!this.program || !this.texture || !this.vao) return

    gl.viewport(0, 0, width, height)
    gl.useProgram(this.program)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.uniform1i(this.uniforms['u_image'], 0)
    gl.uniform2f(this.uniforms['u_resolution'], width, height)

    // Bind all 13 adjustment uniforms
    gl.uniform1f(this.uniforms['u_exposure'], adjustments.exposure)
    gl.uniform1f(this.uniforms['u_brilliance'], adjustments.brilliance)
    gl.uniform1f(this.uniforms['u_highlights'], adjustments.highlights)
    gl.uniform1f(this.uniforms['u_shadows'], adjustments.shadows)
    gl.uniform1f(this.uniforms['u_contrast'], adjustments.contrast)
    gl.uniform1f(this.uniforms['u_brightness'], adjustments.brightness)
    gl.uniform1f(this.uniforms['u_saturation'], adjustments.saturation)
    gl.uniform1f(this.uniforms['u_vibrance'], adjustments.vibrance)
    gl.uniform1f(this.uniforms['u_warmth'], adjustments.warmth)
    gl.uniform1f(this.uniforms['u_tint'], adjustments.tint)
    gl.uniform1f(this.uniforms['u_sharpness'], adjustments.sharpness)
    gl.uniform1f(this.uniforms['u_definition'], adjustments.definition)
    gl.uniform1f(this.uniforms['u_noise'], adjustments.noise)

    gl.bindVertexArray(this.vao)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.bindVertexArray(null)
  }

  public destroy() {
    const gl = this.gl
    if (this.texture) gl.deleteTexture(this.texture)
    if (this.vbo) gl.deleteBuffer(this.vbo)
    if (this.vao) gl.deleteVertexArray(this.vao)
    if (this.program) gl.deleteProgram(this.program)
  }
}
