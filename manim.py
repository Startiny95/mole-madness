from manim import *

class UNetDiffusion(Scene):
    def construct(self):
        self.camera.background_color = "#0f0f1a"

        # ─── TITLE ───────────────────────────────────────────────
        title = Text("U-Net in Diffusion Models", font_size=36, color=WHITE)
        subtitle = Text("From noise to image — step by step", font_size=20, color=GREY_B)
        title.to_edge(UP, buff=0.3)
        subtitle.next_to(title, DOWN, buff=0.1)
        self.play(Write(title), FadeIn(subtitle))
        self.wait(0.5)

        # ─── NOISY IMAGE (input) ─────────────────────────────────
        noisy_box = Square(side_length=0.9, color=YELLOW_E, fill_opacity=0.25)
        noisy_label = Text("Noisy\nImage", font_size=14, color=YELLOW_E).move_to(noisy_box)
        noisy_group = VGroup(noisy_box, noisy_label).move_to(LEFT * 6.0 + DOWN * 0.3)

        self.play(FadeIn(noisy_group))
        self.wait(0.3)

        # ─── ENCODER BLOCKS ──────────────────────────────────────
        enc_colors = [BLUE_B, BLUE_C, BLUE_D, BLUE_E]
        enc_labels = ["E1\n64ch", "E2\n128ch", "E3\n256ch", "E4\n512ch"]
        enc_widths  = [1.0, 0.85, 0.70, 0.55]
        enc_heights = [0.7, 0.6, 0.5, 0.4]

        encoder_blocks = []
        enc_x_start = -4.2
        enc_x_step  =  1.2
        enc_y_base  =  0.0          # will descend
        for i, (col, lbl, w, h) in enumerate(zip(enc_colors, enc_labels, enc_widths, enc_heights)):
            y = enc_y_base - i * 0.5
            x = enc_x_start + i * enc_x_step
            rect  = Rectangle(width=w, height=h, color=col, fill_opacity=0.4)
            label = Text(lbl, font_size=12, color=col)
            grp   = VGroup(rect, label).move_to([x, y, 0])
            encoder_blocks.append(grp)

        enc_title = Text("Encoder", font_size=16, color=BLUE_B)
        enc_title.move_to([enc_x_start + 1.5, 1.3, 0])

        self.play(FadeIn(enc_title))
        for i, blk in enumerate(encoder_blocks):
            arr = Arrow(
                noisy_group.get_right() if i == 0 else encoder_blocks[i-1].get_right(),
                blk.get_left(),
                buff=0.08, stroke_width=2, color=GREY_B
            )
            self.play(GrowArrow(arr), FadeIn(blk), run_time=0.4)

        self.wait(0.3)

        # ─── BOTTLENECK ──────────────────────────────────────────
        bot_rect  = Rectangle(width=1.0, height=0.55, color=PURPLE_B, fill_opacity=0.5)
        bot_label = Text("Bottleneck\n(Attention)", font_size=11, color=PURPLE_A)
        bot_group = VGroup(bot_rect, bot_label).move_to([0.2, -1.8, 0])

        bot_title = Text("Middle Block", font_size=16, color=PURPLE_B)
        bot_title.move_to([0.2, -1.0, 0])

        bot_arr = Arrow(encoder_blocks[-1].get_bottom(),
                        bot_group.get_left(), buff=0.1,
                        stroke_width=2, color=GREY_B)
        self.play(FadeIn(bot_title), GrowArrow(bot_arr), FadeIn(bot_group))

        # Attention pulse
        pulse = bot_rect.copy().set_color(PURPLE_A).set_opacity(0.0)
        self.play(
            pulse.animate.scale(1.4).set_opacity(0.5),
            rate_func=there_and_back, run_time=0.8
        )
        self.remove(pulse)
        self.wait(0.3)

        # ─── DECODER BLOCKS ──────────────────────────────────────
        dec_colors = [GREEN_E, GREEN_D, GREEN_C, GREEN_B]
        dec_labels = ["D4\n512ch", "D3\n256ch", "D2\n128ch", "D1\n64ch"]
        dec_widths  = enc_widths[::-1]
        dec_heights = enc_heights[::-1]

        decoder_blocks = []
        dec_x_start =  1.5
        dec_x_step  =  1.1
        for i, (col, lbl, w, h) in enumerate(zip(dec_colors, dec_labels, dec_widths, dec_heights)):
            y = -1.8 + i * 0.5
            x = dec_x_start + i * dec_x_step
            rect  = Rectangle(width=w, height=h, color=col, fill_opacity=0.4)
            label = Text(lbl, font_size=12, color=col)
            grp   = VGroup(rect, label).move_to([x, y, 0])
            decoder_blocks.append(grp)

        dec_title = Text("Decoder", font_size=16, color=GREEN_B)
        dec_title.move_to([dec_x_start + 1.5, 1.3, 0])

        self.play(FadeIn(dec_title))
        for i, blk in enumerate(decoder_blocks):
            src = bot_group if i == 0 else decoder_blocks[i-1]
            arr = Arrow(src.get_right() if i == 0 else src.get_right(),
                        blk.get_left(), buff=0.08,
                        stroke_width=2, color=GREY_B)
            self.play(GrowArrow(arr), FadeIn(blk), run_time=0.4)

        self.wait(0.3)

        # ─── OUTPUT ──────────────────────────────────────────────
        out_box   = Square(side_length=0.9, color=GOLD_B, fill_opacity=0.3)
        out_label = Text("Clean\nImage", font_size=14, color=GOLD_B).move_to(out_box)
        out_group = VGroup(out_box, out_label).next_to(decoder_blocks[-1], RIGHT, buff=0.5)

        out_arr = Arrow(decoder_blocks[-1].get_right(), out_group.get_left(),
                        buff=0.08, stroke_width=2, color=GREY_B)
        self.play(GrowArrow(out_arr), FadeIn(out_group))
        self.wait(0.4)

        # ─── SKIP CONNECTIONS ────────────────────────────────────
        skip_label = Text("Skip Connections", font_size=15, color=ORANGE)
        skip_label.to_edge(DOWN, buff=0.25)
        self.play(FadeIn(skip_label))

        # Draw curved arcs from each encoder block to its mirror decoder block
        # Encoder order: E1→E4 (left→right, top→bottom)
        # Decoder order: D4→D1 (left→right, bottom→top)
        # Mirrored pairs: E1↔D1, E2↔D2, E3↔D3, E4↔D4
        mirror_pairs = [
            (encoder_blocks[0], decoder_blocks[3]),
            (encoder_blocks[1], decoder_blocks[2]),
            (encoder_blocks[2], decoder_blocks[1]),
            (encoder_blocks[3], decoder_blocks[0]),
        ]
        skip_arcs = []
        for enc_blk, dec_blk in mirror_pairs:
            arc = CurvedArrow(
                enc_blk.get_top(),
                dec_blk.get_top(),
                angle=-TAU / 6,
                color=ORANGE,
                stroke_width=1.5,
            )
            skip_arcs.append(arc)

        self.play(*[Create(a) for a in skip_arcs], run_time=1.2)
        self.wait(0.5)

        # ─── HIGHLIGHT FLOW SUMMARY ──────────────────────────────
        summary = Text(
            "Encoder compresses → Bottleneck reasons → Decoder rebuilds",
            font_size=14, color=GREY_A
        ).to_edge(DOWN, buff=0.6)
        self.play(FadeOut(skip_label), FadeIn(summary))
        self.wait(2)

        # ─── FADE OUT ────────────────────────────────────────────
        self.play(*[FadeOut(mob) for mob in self.mobjects], run_time=1.5)
        done = Text("U-Net: Compress → Think → Reconstruct", font_size=30, color=WHITE)
        self.play(Write(done))
        self.wait(2)